import {
  ACTOR_STATE_GROUP,
  actorStateGroupSchema,
  sortByName,
  workerStateSchema,
  type ActorRow,
  type AgentProfileCount,
  type Fleet,
  type FleetSummary,
  type Labels,
  type ReadyFleet,
  type RoomSize,
  type SubstrateResources,
  type WorkerPoolRef,
  type WorkerPoolRow,
  type WorkerRow,
} from "@my-project/shared";
import { K8sClient } from "../../../clients/k8s/index.js";
import type { TRPCContext } from "../../../context/types.js";
import { codebaseNamespace, readCodebaseLinks, withCodebase, type CodebaseLinks } from "./codebaseLinks.js";
import { needsAttentionOf } from "./needsAttention.js";
import { hostsActors, roomSizeOf, selects, workerPoolRoomOf, workerRoomOf } from "./room.js";
import { readSubstrate, type SubstrateFleet } from "./substrateRead.js";
import { readWorkerPools, type WorkerPoolRead } from "./workerPools.js";
import type { SubstrateWorker } from "../../../clients/agentSubstrate/index.js";

export { getAgent } from "./agent.js";

/** The current actor templates of one worker selector. */
interface SelectorGroup {
  workerSelector: Labels;
  /** The largest limits over the actor templates. Null when none sets a limit. */
  size: RoomSize | null;
  /** By namespace, then name. */
  usableWorkerPools: WorkerPoolRef[];
}

function selectorKey(workerSelector: Labels): string {
  return JSON.stringify(Object.entries(workerSelector).sort(([a], [b]) => (a < b ? -1 : 1)));
}

/** By `selectorKey`. An actor whose actor template is gone is in no group. */
function selectorGroupsOf(fleet: SubstrateFleet): Map<string, SelectorGroup> {
  const groups = new Map<string, SelectorGroup>();
  for (const { actorTemplate } of fleet.actors) {
    if (!actorTemplate) continue;
    const key = selectorKey(actorTemplate.workerSelector);
    const group = groups.get(key);
    if (group) group.size = roomSizeOf([group.size, actorTemplate.limits]);
    else {
      groups.set(key, {
        workerSelector: actorTemplate.workerSelector,
        size: roomSizeOf([actorTemplate.limits]),
        usableWorkerPools: [],
      });
    }
  }
  return groups;
}

function toActorRow(
  { actor, agent, actorTemplate }: SubstrateFleet["actors"][number],
  selectorGroups: Map<string, SelectorGroup>,
  codebaseLinks: CodebaseLinks
): ActorRow {
  const assignment = actor.workerAssignment;
  const selectorGroup = actorTemplate && selectorGroups.get(selectorKey(actorTemplate.workerSelector));
  return {
    atespace: actor.atespace,
    name: actor.name,
    uid: actor.uid,
    state: actor.state,
    actorTemplate: actor.actorTemplate.name,
    workerSelector: actorTemplate ? { ...actorTemplate.workerSelector } : null,
    size: actorTemplate ? roomSizeOf([actorTemplate.limits]) : null,
    usableWorkerPools: (selectorGroup?.usableWorkerPools ?? []).map((workerPool) => ({ ...workerPool })),
    agent: agent && withCodebase(agent, codebaseLinks),
    placement: assignment && {
      worker: assignment.worker,
      workerPool: assignment.workerPool,
      workerNamespace: assignment.workerNamespace,
      workerPod: assignment.workerPod,
      node: assignment.nodeName,
      sandboxRuntime: assignment.sandboxRuntime,
    },
    createdAt: actor.createTime,
    updatedAt: actor.updateTime,
    crash: actor.crash && { message: actor.crash.message, at: actor.crash.crashTime },
    snapshots: actor.snapshots.map(({ uuid, generation, fidelity, locality, durableState }) => ({
      uuid,
      generation,
      fidelity,
      locality,
      durableState,
    })),
  };
}

function toWorkerRow(worker: SubstrateWorker): WorkerRow {
  return {
    name: worker.name,
    workerPool: worker.workerPool,
    workerNamespace: worker.workerNamespace,
    pod: worker.workerPod,
    node: worker.nodeName,
    state: worker.state,
    capacity: { ...worker.capacity },
    allocated: { ...worker.allocated },
    sandboxClasses: [...worker.sandboxClasses],
    registered: worker.registered,
  };
}

function zeroCounts<K extends string>(keys: readonly K[]): Record<K, number> {
  return Object.fromEntries(keys.map((key) => [key, 0])) as Record<K, number>;
}

function agentsByProfileOf(fleet: SubstrateFleet): AgentProfileCount[] {
  const counts = new Map<string | null, number>();
  for (const { agent } of fleet.actors) {
    if (agent) counts.set(agent.agentProfile, (counts.get(agent.agentProfile) ?? 0) + 1);
  }
  return [...counts]
    .map(([agentProfile, agents]) => ({ agentProfile, agents }))
    .sort((a, b) => {
      if (a.agentProfile === null || b.agentProfile === null) return a.agentProfile === null ? 1 : -1;
      return sortByName(a.agentProfile, b.agentProfile);
    });
}

function summarize(fleet: SubstrateFleet): FleetSummary {
  const actorsByState = zeroCounts(actorStateGroupSchema.options);
  for (const { actor } of fleet.actors) actorsByState[ACTOR_STATE_GROUP[actor.state]]++;

  const workersByState = zeroCounts(workerStateSchema.options);
  for (const worker of fleet.workers) workersByState[worker.state]++;

  return {
    atespaces: fleet.atespaces.length,
    agents: fleet.actors.filter(({ agent }) => agent !== null).length,
    agentsByProfile: agentsByProfileOf(fleet),
    actors: fleet.actors.length,
    actorsByState,
    workers: fleet.workers.length,
    workersByState,
  };
}

function addResources(sum: SubstrateResources, add: SubstrateResources): void {
  sum.cpuMillicores += add.cpuMillicores;
  sum.memoryBytes += add.memoryBytes;
  sum.actors += add.actors;
}

const zeroResources = (): SubstrateResources => ({ cpuMillicores: 0, memoryBytes: 0, actors: 0 });

function emptyWorkerPoolRow(namespace: string, name: string): WorkerPoolRow {
  return {
    name,
    namespace,
    workers: [],
    capacity: zeroResources(),
    allocated: zeroResources(),
    workerLabels: {},
    roomSize: null,
    room: 0,
    limitedBy: [],
    roomState: "noWorker",
    resource: null,
  };
}

/**
 * `workers`: all workers of the worker pool, by name. A selector group that matches an active, registered worker gets
 * the row in `usableWorkerPools`. No selector group: every active, registered worker adds room, in actors only.
 */
function fillWorkerPoolRow(row: WorkerPoolRow, workers: SubstrateWorker[], selectorGroups: SelectorGroup[]): void {
  const hosting = workers.filter(hostsActors);
  row.workers = workers.map(({ name }) => name);
  row.workerLabels = { ...(hosting[0] ?? workers[0])?.labels };
  for (const worker of workers) {
    addResources(row.capacity, worker.capacity);
    addResources(row.allocated, worker.allocated);
  }

  if (hosting.length === 0) return;

  const usedBy = selectorGroups.filter(({ workerSelector }) =>
    hosting.some((worker) => selects(workerSelector, worker.labels))
  );
  if (selectorGroups.length > 0 && usedBy.length === 0) {
    row.roomState = "noTemplate";
    return;
  }
  for (const group of usedBy) group.usableWorkerPools.push({ namespace: row.namespace, name: row.name });

  const roomSize = roomSizeOf(usedBy.map(({ size }) => size));
  const usable = hosting.filter(
    (worker) =>
      selectorGroups.length === 0 || usedBy.some(({ workerSelector }) => selects(workerSelector, worker.labels))
  );
  const { room, limitedBy, roomState } = workerPoolRoomOf(usable.map((worker) => workerRoomOf(worker, roomSize)));
  row.roomSize = roomSize;
  row.room = room;
  row.limitedBy = limitedBy;
  row.roomState = roomState;
}

/** Rows: the worker pools that workers name and the WorkerPools that were read. */
function toWorkerPools(
  fleet: SubstrateFleet,
  workerPoolRead: WorkerPoolRead,
  selectorGroups: SelectorGroup[]
): ReadyFleet["workerPools"] {
  const entries = new Map<string, { row: WorkerPoolRow; workers: SubstrateWorker[] }>();
  const entryOf = (namespace: string, name: string) => {
    const key = JSON.stringify([namespace, name]);
    let entry = entries.get(key);
    if (!entry) {
      entry = { row: emptyWorkerPoolRow(namespace, name), workers: [] };
      entries.set(key, entry);
    }
    return entry;
  };

  for (const worker of fleet.workers) {
    entryOf(worker.workerNamespace, worker.workerPool).workers.push(worker);
  }
  for (const { namespace, name, resource } of workerPoolRead.items) {
    entryOf(namespace, name).row.resource = resource;
  }

  const sorted = [...entries.values()].sort(
    (a, b) => sortByName(a.row.namespace, b.row.namespace) || sortByName(a.row.name, b.row.name)
  );
  for (const { row, workers } of sorted) {
    workers.sort((a, b) => sortByName(a.name, b.name));
    fillWorkerPoolRow(row, workers, selectorGroups);
  }
  return {
    access: workerPoolRead.access,
    items: sorted.map(({ row }) => row),
  };
}

function toReadyFleet(fleet: SubstrateFleet, codebaseLinks: CodebaseLinks, workerPoolRead: WorkerPoolRead): ReadyFleet {
  const selectorGroups = selectorGroupsOf(fleet);
  const workerPools = toWorkerPools(fleet, workerPoolRead, [...selectorGroups.values()]);
  const actors = fleet.actors.map((actor) => toActorRow(actor, selectorGroups, codebaseLinks));
  const workers = fleet.workers.map(toWorkerRow);
  return {
    state: "ready",
    updatedAt: fleet.readAt,
    summary: summarize(fleet),
    atespaces: fleet.atespaces.map(({ name, uid, createTime }) => ({ name, uid, createdAt: createTime })),
    actors,
    workers,
    workerPools,
    needsAttention: needsAttentionOf({ actors, workers, workerPools }, fleet.readAt),
  };
}

/**
 * Reads with the user's `idToken`: Codebases in `DEFAULT_CLUSTER_NAMESPACE` (unset: no Codebase, no issue link) and
 * WorkerPools in the worker namespaces.
 */
export async function getFleet(ctx: TRPCContext): Promise<Fleet> {
  if (!ctx.agentSubstrateSource) {
    return { state: "notConfigured" };
  }

  const read = await readSubstrate(ctx.agentSubstrateSource);
  if (!read.ok) {
    return { state: "unreachable", reason: read.reason };
  }

  const projectPaths = new Set(read.fleet.actors.flatMap(({ agent }) => (agent ? [agent.issue.projectPath] : [])));
  const namespace = codebaseNamespace();
  const { workerNamespaces } = read.fleet;
  const needsK8s = (namespace !== "" && projectPaths.size > 0) || workerNamespaces.length > 0;
  const k8sClient = needsK8s ? new K8sClient(ctx.session) : null;
  const [codebaseLinks, workerPoolRead] = await Promise.all([
    readCodebaseLinks(k8sClient, namespace, projectPaths),
    readWorkerPools(k8sClient, workerNamespaces),
  ]);
  return toReadyFleet(read.fleet, codebaseLinks, workerPoolRead);
}
