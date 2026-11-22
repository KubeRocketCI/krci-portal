import {
  actorStateGroupSchema,
  workerStateSchema,
  type ActorAgent,
  type ActorRow,
  type ActorState,
  type ActorStateGroup,
  type FleetSnapshot,
  type FleetSummary,
  type ReadyFleetSnapshot,
  type WorkerRow,
} from "@my-project/shared";
import type { TRPCContext } from "../../../context/types.js";
import { readSubstrate, type SubstrateFleet } from "./substrateRead.js";
import type { SubstrateActor, SubstrateWorker } from "../../../clients/agentSubstrate/index.js";

const STATE_GROUP: Record<ActorState, ActorStateGroup> = {
  running: "running",
  suspended: "suspended",
  crashed: "crashed",
  unknown: "unknown",
  resuming: "transitional",
  suspending: "transitional",
  deleting: "transitional",
  reverting: "transitional",
  transitional: "transitional",
};

function toActorRow(actor: SubstrateActor, agent: ActorAgent | null): ActorRow {
  const assignment = actor.workerAssignment;
  return {
    atespace: actor.atespace,
    name: actor.name,
    uid: actor.uid,
    state: actor.state,
    actorTemplate: actor.actorTemplate.name,
    agent: agent && structuredClone(agent),
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
  };
}

function zeroCounts<K extends string>(keys: readonly K[]): Record<K, number> {
  return Object.fromEntries(keys.map((key) => [key, 0])) as Record<K, number>;
}

function summarize(fleet: SubstrateFleet): FleetSummary {
  const actorsByState = zeroCounts(actorStateGroupSchema.options);
  for (const { actor } of fleet.actors) actorsByState[STATE_GROUP[actor.state]]++;

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

function toReadySnapshot(fleet: SubstrateFleet): ReadyFleetSnapshot {
  return {
    state: "ready",
    updatedAt: fleet.readAt,
    summary: summarize(fleet),
    atespaces: fleet.atespaces.map(({ name, uid, createTime }) => ({ name, uid, createdAt: createTime })),
    actors: fleet.actors.map(({ actor, agent }) => toActorRow(actor, agent)),
    workers: fleet.workers.map(toWorkerRow),
    workerPools: { access: "ok", items: [] },
    needsAttention: [],
  };
}

/** No source in the context: not configured, with no network call. */
export async function getFleet(ctx: TRPCContext): Promise<FleetSnapshot> {
  if (!ctx.agentSubstrateSource) {
    return { state: "notConfigured" };
  }

  const read = await readSubstrate(ctx.agentSubstrateSource);
  if (!read.ok) {
    return { state: "unreachable", reason: read.reason };
  }
  return toReadySnapshot(read.fleet);
}
