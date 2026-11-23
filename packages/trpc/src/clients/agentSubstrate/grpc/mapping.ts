import { timestampDate, type Timestamp } from "@bufbuild/protobuf/wkt";
import type {
  ActorState as PortalActorState,
  SnapshotDurableState,
  SnapshotFidelity as PortalSnapshotFidelity,
  SubstrateResources,
  WorkerState as PortalWorkerState,
} from "@my-project/shared";
import type {
  SubstrateActor,
  SubstrateActorTemplate,
  SubstrateAtespace,
  SubstrateSnapshot,
  SubstrateWorker,
} from "../source.js";
import {
  ActorState,
  SnapshotFidelity,
  SnapshotStorageState,
  WorkerState,
  type Actor,
  type ActorTemplate,
  type Atespace,
  type Snapshot,
  type Worker,
  type WorkerResources,
} from "./gen/ateapi/v1/ateapi_pb.js";

/** An unset state cannot be read: `unknown`. A state that this proto does not name: `transitional`. */
const ACTOR_STATES: Record<number, PortalActorState> = {
  [ActorState.UNSPECIFIED]: "unknown",
  [ActorState.RESUMING]: "resuming",
  [ActorState.RUNNING]: "running",
  [ActorState.SUSPENDING]: "suspending",
  [ActorState.SUSPENDED]: "suspended",
  [ActorState.CRASHED]: "crashed",
  [ActorState.DELETING]: "deleting",
  [ActorState.REVERTING]: "reverting",
};

const WORKER_STATES: Record<number, PortalWorkerState> = {
  [WorkerState.ACTIVE]: "active",
  [WorkerState.DRAINING]: "draining",
  [WorkerState.UNAVAILABLE]: "unavailable",
};

const SNAPSHOT_FIDELITIES: Record<number, PortalSnapshotFidelity> = {
  [SnapshotFidelity.VOLUMES]: "volumes",
  [SnapshotFidelity.ROOTFS]: "rootfs",
  [SnapshotFidelity.MEMORY]: "memory",
};

const DURABLE_STATES: Record<number, SnapshotDurableState> = {
  [SnapshotStorageState.PENDING]: "pending",
  [SnapshotStorageState.COMPLETED]: "completed",
};

function optionalIsoTime(timestamp: Timestamp | undefined): string | null {
  return timestamp ? timestampDate(timestamp).toISOString() : null;
}

/** ISO 8601; empty when the server sent no time. */
function isoTime(timestamp: Timestamp | undefined): string {
  return optionalIsoTime(timestamp) ?? "";
}

/** int64 fields arrive as bigint; unset is 0. */
function num(value: bigint | undefined): number {
  return Number(value ?? 0n);
}

function resources(value: WorkerResources | undefined): SubstrateResources {
  return {
    cpuMillicores: num(value?.cpuMillicores),
    memoryBytes: num(value?.memoryBytes),
    actors: value?.actors ?? 0,
  };
}

function toSnapshot(snapshot: Snapshot): SubstrateSnapshot {
  return {
    uuid: snapshot.uuid,
    generation: snapshot.generation,
    fidelity: SNAPSHOT_FIDELITIES[snapshot.fidelity] ?? "unknown",
    locality: snapshot.locality || null,
    durableState: snapshot.durableSnapshot ? (DURABLE_STATES[snapshot.durableSnapshot.state] ?? "unknown") : "none",
  };
}

export function toAtespace(atespace: Atespace): SubstrateAtespace {
  return {
    name: atespace.metadata?.name ?? "",
    uid: atespace.metadata?.uid ?? "",
    createTime: isoTime(atespace.metadata?.createTime),
  };
}

export function toActor(actor: Actor): SubstrateActor {
  const status = actor.status;
  const assignment = status?.workerAssignment;
  return {
    atespace: actor.metadata?.atespace ?? "",
    name: actor.metadata?.name ?? "",
    uid: actor.metadata?.uid ?? "",
    createTime: isoTime(actor.metadata?.createTime),
    updateTime: isoTime(actor.metadata?.updateTime),
    actorTemplate: { atespace: actor.actorTemplate?.atespace ?? "", name: actor.actorTemplate?.name ?? "" },
    state: status ? (ACTOR_STATES[status.state] ?? "transitional") : "unknown",
    workerAssignment: assignment
      ? {
          worker: assignment.worker?.name ?? "",
          workerPool: assignment.workerPool,
          workerNamespace: assignment.workerNamespace,
          workerPod: assignment.workerPod,
          nodeName: assignment.nodeName,
          sandboxRuntime: assignment.sandboxRuntime?.sandboxClass || null,
        }
      : null,
    crash: status?.crash ? { message: status.crash.message, crashTime: optionalIsoTime(status.crash.crashTime) } : null,
    snapshots: (status?.snapshots ?? []).map(toSnapshot),
  };
}

export function toActorTemplate(template: ActorTemplate): SubstrateActorTemplate {
  return {
    atespace: template.metadata?.atespace ?? "",
    name: template.metadata?.name ?? "",
    uid: template.metadata?.uid ?? "",
    containers: template.containers.map((container) => ({
      name: container.name,
      env: container.env.map(({ name, value }) => ({ name, value })),
    })),
    limits: {
      cpuMillicores: num(template.resources?.limits?.cpuMillicores),
      memoryBytes: num(template.resources?.limits?.memoryBytes),
    },
  };
}

export function toWorker(worker: Worker): SubstrateWorker {
  const [firstClass] = worker.status?.sandboxClasses ?? [];
  const overhead = firstClass?.defaultRuntime?.actorOverhead;
  return {
    name: worker.metadata?.name ?? "",
    workerPool: worker.workerPool,
    workerNamespace: worker.workerNamespace,
    workerPod: worker.workerPod,
    nodeName: worker.nodeName,
    state: WORKER_STATES[worker.status?.state ?? WorkerState.UNSPECIFIED] ?? "unknown",
    capacity: resources(worker.status?.capacity),
    allocated: resources(worker.status?.allocated),
    sandboxClasses: (worker.status?.sandboxClasses ?? []).map((sandboxClass) => sandboxClass.sandboxClass),
    registered: num(worker.status?.registeredEpoch) !== 0 && Boolean(firstClass?.sandboxClass),
    actorOverhead: overhead
      ? { memoryBytes: num(overhead.memoryBytes), memoryBytesPerGib: num(overhead.memoryBytesPerGib) }
      : null,
  };
}
