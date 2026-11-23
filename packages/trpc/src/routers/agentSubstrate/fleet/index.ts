import {
  ACTOR_STATE_GROUP,
  actorStateGroupSchema,
  sortByName,
  workerStateSchema,
  type ActorAgent,
  type ActorRow,
  type FleetSnapshot,
  type FleetSummary,
  type ReadyFleetSnapshot,
  type SubstrateResources,
  type WorkerPoolRow,
  type WorkerRow,
} from "@my-project/shared";
import { K8sClient } from "../../../clients/k8s/index.js";
import type { TRPCContext } from "../../../context/types.js";
import { gitlabIssueUrl, readCodebaseLinks, type CodebaseLinks } from "./codebaseLinks.js";
import { roomOf, roomSizeOf } from "./room.js";
import { readSubstrate, type SubstrateFleet } from "./substrateRead.js";
import { readWorkerPools, type WorkerPoolRead } from "./workerPools.js";
import type { SubstrateActor, SubstrateWorker } from "../../../clients/agentSubstrate/index.js";

/** Codebase and issue URL come from the user's Codebase list: per request, never part of the shared read. */
function withCodebase(agent: ActorAgent, codebaseLinks: CodebaseLinks): ActorAgent {
  const { issue } = agent;
  const link = codebaseLinks.get(issue.projectPath);
  return {
    ...agent,
    issue: {
      ...issue,
      url: link?.gitlabRepoUrl ? gitlabIssueUrl(link.gitlabRepoUrl, issue.iid) : null,
    },
    codebase: link ? { ...link.codebase } : null,
  };
}

function toActorRow(actor: SubstrateActor, agent: ActorAgent | null, codebaseLinks: CodebaseLinks): ActorRow {
  const assignment = actor.workerAssignment;
  return {
    atespace: actor.atespace,
    name: actor.name,
    uid: actor.uid,
    state: actor.state,
    actorTemplate: actor.actorTemplate.name,
    agent: agent && withCodebase(agent, codebaseLinks),
    placement: assignment && {
      worker: assignment.worker,
      workerPool: assignment.workerPool,
      workerNamespace: assignment.workerNamespace,
      pod: assignment.workerPod,
      node: assignment.nodeName,
      sandboxRuntime: assignment.sandboxRuntime,
    },
    createdAt: actor.createTime,
    updatedAt: actor.updateTime,
    crash: actor.crash && { message: actor.crash.message, at: actor.crash.crashTime },
    snapshots: actor.snapshots.map((snapshot) => ({ ...snapshot })),
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

function summarize(fleet: SubstrateFleet): FleetSummary {
  const actorsByState = zeroCounts(actorStateGroupSchema.options);
  for (const { actor } of fleet.actors) actorsByState[ACTOR_STATE_GROUP[actor.state]]++;

  const workersByState = zeroCounts(workerStateSchema.options);
  for (const worker of fleet.workers) workersByState[worker.state]++;

  return {
    atespaces: fleet.atespaces.length,
    agents: fleet.actors.filter(({ agent }) => agent !== null).length,
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
    room: 0,
    resource: null,
  };
}

/** Rows: the worker pools that workers name and the WorkerPools that were read. */
function toWorkerPools(fleet: SubstrateFleet, workerPoolRead: WorkerPoolRead): ReadyFleetSnapshot["workerPools"] {
  const size = roomSizeOf(fleet.actors.map(({ limits }) => limits));
  const rows = new Map<string, WorkerPoolRow>();
  const rowOf = (namespace: string, name: string) => {
    const key = JSON.stringify([namespace, name]);
    let row = rows.get(key);
    if (!row) {
      row = emptyWorkerPoolRow(namespace, name);
      rows.set(key, row);
    }
    return row;
  };

  for (const worker of fleet.workers) {
    const row = rowOf(worker.workerNamespace, worker.workerPool);
    row.workers.push(worker.name);
    addResources(row.capacity, worker.capacity);
    addResources(row.allocated, worker.allocated);
    row.room += roomOf(worker, size);
  }
  for (const { namespace, name, resource } of workerPoolRead.items) {
    rowOf(namespace, name).resource = resource;
  }

  const items = [...rows.values()];
  for (const row of items) row.workers.sort(sortByName);
  items.sort((a, b) => sortByName(a.namespace, b.namespace) || sortByName(a.name, b.name));
  return {
    access: workerPoolRead.access,
    items,
    roomSize: size,
  };
}

function toReadySnapshot(
  fleet: SubstrateFleet,
  codebaseLinks: CodebaseLinks,
  workerPoolRead: WorkerPoolRead
): ReadyFleetSnapshot {
  return {
    state: "ready",
    updatedAt: fleet.readAt,
    summary: summarize(fleet),
    atespaces: fleet.atespaces.map(({ name, uid, createTime }) => ({ name, uid, createdAt: createTime })),
    actors: fleet.actors.map(({ actor, agent }) => toActorRow(actor, agent, codebaseLinks)),
    workers: fleet.workers.map(toWorkerRow),
    workerPools: toWorkerPools(fleet, workerPoolRead),
    needsAttention: [],
  };
}

/**
 * Reads with the user's `idToken`: Codebases in `DEFAULT_CLUSTER_NAMESPACE` (unset: no Codebase, no issue link) and
 * WorkerPools in the worker namespaces.
 */
export async function getFleet(ctx: TRPCContext): Promise<FleetSnapshot> {
  if (!ctx.agentSubstrateSource) {
    return { state: "notConfigured" };
  }

  const read = await readSubstrate(ctx.agentSubstrateSource);
  if (!read.ok) {
    return { state: "unreachable", reason: read.reason };
  }

  const projectPaths = new Set(read.fleet.actors.flatMap(({ agent }) => (agent ? [agent.issue.projectPath] : [])));
  const codebaseNamespace = process.env.DEFAULT_CLUSTER_NAMESPACE ?? "";
  const { workerNamespaces } = read.fleet;
  const needsK8s = (codebaseNamespace !== "" && projectPaths.size > 0) || workerNamespaces.length > 0;
  const k8sClient = needsK8s ? new K8sClient(ctx.session) : null;
  const [codebaseLinks, workerPoolRead] = await Promise.all([
    readCodebaseLinks(k8sClient, codebaseNamespace, projectPaths),
    readWorkerPools(k8sClient, workerNamespaces),
  ]);
  return toReadySnapshot(read.fleet, codebaseLinks, workerPoolRead);
}
