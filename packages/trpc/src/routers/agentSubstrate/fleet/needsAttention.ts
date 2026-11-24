import {
  latestSnapshot,
  sortByName,
  type ActorRow,
  type AttentionItem,
  type AttentionKind,
  type AttentionSeverity,
  type ReadyFleet,
  type WorkerPoolRow,
  type WorkerRow,
} from "@my-project/shared";

interface FleetRows {
  actors: ActorRow[];
  workers: WorkerRow[];
  workerPools: ReadyFleet["workerPools"];
}

const SEVERITY_RANK: Record<AttentionSeverity, number> = { error: 0, warning: 1 };

const KIND_RANK: Record<AttentionKind, number> = {
  actorCrashed: 0,
  actorUnschedulable: 1,
  workerPoolNotReady: 2,
  workerNotActive: 3,
  snapshotPending: 4,
};

/** Agent Substrate's `over_15m` upload-overdue band. */
const SNAPSHOT_PENDING_AFTER_MS = 15 * 60_000;

function crashedActorItems(actor: ActorRow): AttentionItem[] {
  if (actor.state !== "crashed") return [];
  return [
    {
      kind: "actorCrashed",
      severity: "error",
      atespace: actor.atespace,
      name: actor.name,
      message: actor.crash?.message ?? "",
      crashedAt: actor.crash?.at ?? null,
      agent: actor.agent && { issue: actor.agent.issue, agentProfile: actor.agent.agentProfile },
    },
  ];
}

/** `fleetHostsActors`: the fleet has an active, registered worker. */
function unschedulableActorItems(actor: ActorRow, fleetHostsActors: boolean): AttentionItem[] {
  const { workerSelector } = actor;
  if (!fleetHostsActors || actor.state === "deleting") return [];
  if (workerSelector === null || Object.keys(workerSelector).length === 0) return [];
  if (actor.usableWorkerPools.length > 0) return [];
  return [
    {
      kind: "actorUnschedulable",
      severity: "error",
      atespace: actor.atespace,
      name: actor.name,
      workerSelector: { ...workerSelector },
      agent: actor.agent && { issue: actor.agent.issue, agentProfile: actor.agent.agentProfile },
    },
  ];
}

function workerPoolNotReadyItems({ namespace, name, resource }: WorkerPoolRow): AttentionItem[] {
  if (!resource || resource.readyReplicas >= resource.desiredReplicas) return [];
  return [
    {
      kind: "workerPoolNotReady",
      severity: "error",
      namespace,
      name,
      desiredReplicas: resource.desiredReplicas,
      readyReplicas: resource.readyReplicas,
    },
  ];
}

function workerNotActiveItems({ name, state, workerPool, workerNamespace }: WorkerRow): AttentionItem[] {
  if (state === "active") return [];
  return [
    {
      kind: "workerNotActive",
      severity: state === "draining" ? "warning" : "error",
      name,
      state,
      workerPool,
      workerNamespace,
    },
  ];
}

function snapshotPendingItems(actor: ActorRow, now: number): AttentionItem[] {
  const latest = latestSnapshot(actor.snapshots);
  if (latest?.durableState !== "pending") return [];
  const lastChange = Date.parse(actor.updatedAt);
  const hasLastChange = !Number.isNaN(lastChange);
  if (hasLastChange && now - lastChange <= SNAPSHOT_PENDING_AFTER_MS) return [];
  return [
    {
      kind: "snapshotPending",
      severity: "warning",
      atespace: actor.atespace,
      name: actor.name,
      generation: latest.generation,
      updatedAt: hasLastChange ? actor.updatedAt : null,
    },
  ];
}

/** `now`: the time of the Agent Substrate read. */
export function needsAttentionOf({ actors, workers, workerPools }: FleetRows, now: string): AttentionItem[] {
  const nowMs = Date.parse(now);
  const fleetHostsActors = workers.some(({ state, registered }) => state === "active" && registered);
  const items = [
    ...actors.flatMap(crashedActorItems),
    ...actors.flatMap((actor) => unschedulableActorItems(actor, fleetHostsActors)),
    ...workerPools.items.flatMap(workerPoolNotReadyItems),
    ...workers.flatMap(workerNotActiveItems),
    ...actors.flatMap((actor) => snapshotPendingItems(actor, nowMs)),
  ];
  return items.sort(compareItems);
}

/** Epoch ms of the crash or of the actor's last change. Null when the item has no time or it does not parse. */
function timeOf(item: AttentionItem): number | null {
  const time = item.kind === "actorCrashed" ? item.crashedAt : item.kind === "snapshotPending" ? item.updatedAt : null;
  if (time === null) return null;
  const ms = Date.parse(time);
  return Number.isNaN(ms) ? null : ms;
}

function scopeOf(item: AttentionItem): string {
  switch (item.kind) {
    case "actorCrashed":
    case "actorUnschedulable":
    case "snapshotPending":
      return item.atespace;
    case "workerPoolNotReady":
      return item.namespace;
    case "workerNotActive":
      return item.workerNamespace;
  }
}

function compareTimes(a: number | null, b: number | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a - b;
}

function compareItems(a: AttentionItem, b: AttentionItem): number {
  return (
    SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
    KIND_RANK[a.kind] - KIND_RANK[b.kind] ||
    compareTimes(timeOf(a), timeOf(b)) ||
    sortByName(scopeOf(a), scopeOf(b)) ||
    sortByName(a.name, b.name)
  );
}
