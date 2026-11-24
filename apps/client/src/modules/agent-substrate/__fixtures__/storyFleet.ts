import type { QueryClient } from "@tanstack/react-query";
import {
  ACTOR_STATE_GROUP,
  actorStateGroupSchema,
  sortByName,
  type ActorRow,
  type ActorStateGroup,
  type Atespace,
  type AttentionItem,
  type Labels,
  type ReadyFleet,
  type RoomSize,
  type WorkerPoolRef,
  type WorkerPoolRow,
  type WorkerRow,
} from "@my-project/shared";
import { FLEET_QUERY_KEY, type FleetData } from "../hooks/useFleet";
import { NEEDS_ATTENTION_MAX_ROWS } from "../pages/overview/utils/needsAttention";
import testbedFleet from "./fleet.testbed.json";

/** `DEFAULT_CLUSTER_NAMESPACE` of the portal: the namespace of the Codebases. */
const PLATFORM_NAMESPACE = "krci";

/** Recorded on the testbed by packages/trpc/scripts/record-agent-substrate-fixtures.ts. */
export const TESTBED_FLEET = testbedFleet as ReadyFleet;

export const EMPTY_FLEET: ReadyFleet = {
  ...TESTBED_FLEET,
  summary: {
    atespaces: 0,
    agents: 0,
    agentsByProfile: [],
    actors: 0,
    actorsByState: { running: 0, transitional: 0, suspended: 0, crashed: 0, unknown: 0 },
    workers: 0,
    workersByState: { active: 0, draining: 0, unavailable: 0, unknown: 0 },
  },
  atespaces: [],
  actors: [],
  workers: [],
  workerPools: { access: "ok", items: [] },
  needsAttention: [],
};

const SANDBOX_ATESPACE = "krci-sandbox";

const AGENTS_NAMESPACE = TESTBED_FLEET.workers[0].workerNamespace;

const ref = (name: string): WorkerPoolRef => ({ namespace: AGENTS_NAMESPACE, name });

/**
 * The worker pools of STORY_FLEET are labelled `workload=workers`, the worker selector of every testbed actor
 * template: each actor can use both.
 */
const STORY_USABLE_WORKER_POOLS = ["workers", "workers-microvm"];

/** With the usable worker pools of STORY_FLEET. */
function testbedActor(name: string): ActorRow {
  const actor = TESTBED_FLEET.actors.find((row) => row.name === name);
  if (!actor) throw new Error(`testbed fixture has no actor ${name}`);
  return { ...structuredClone(actor), usableWorkerPools: STORY_USABLE_WORKER_POOLS.map(ref) };
}

/** An actor can use only a worker pool with an active, registered worker. */
function withoutUsableWorkerPool(fleet: ReadyFleet, name: string): void {
  for (const actor of fleet.actors) {
    actor.usableWorkerPools = actor.usableWorkerPools.filter((workerPool) => workerPool.name !== name);
  }
}

export const RUNNING_ACTOR: ActorRow = (() => {
  const actor = testbedActor("issue-2-25");
  actor.state = "running";
  actor.agent!.codebase = { name: "test-go-app", namespace: PLATFORM_NAMESPACE };
  actor.agent!.issue.url = "https://gitlab.example.com/krci/test-go-app/-/issues/25";
  actor.placement = {
    worker: "workers-7c9f6",
    workerPool: "workers",
    workerNamespace: "krci-agents",
    workerPod: "workers-7c9f6-0",
    node: "krci-control-plane",
    sandboxRuntime: "gvisor",
  };
  actor.snapshots.push({
    uuid: "5d0f1f9e-0b7e-4a39-9a1c-2f0b8d1e4c11",
    generation: 2,
    fidelity: "rootfs",
    locality: "krci-control-plane",
    durableState: "pending",
  });
  return actor;
})();

export const CRASHED_ACTOR: ActorRow = (() => {
  const actor = testbedActor("issue-5-4");
  actor.state = "crashed";
  actor.agent!.codebase = { name: "test-python-app", namespace: PLATFORM_NAMESPACE };
  actor.agent!.issue.url = "https://gitlab.example.com/krci/test-python-app/-/issues/4";
  actor.crash = { message: "sandbox exited with code 137: out of memory", at: "2026-11-22T21:40:11.000Z" };
  return actor;
})();

/** Not made by the dispatcher; Agent Substrate reports no actor state. No worker selector and no limits. */
export const PLAIN_ACTOR: ActorRow = {
  atespace: SANDBOX_ATESPACE,
  name: "debug-shell",
  uid: "0c7d1a52-91a4-4c1b-a7a3-3a8f5d0e2b6f",
  state: "unknown",
  actorTemplate: "debug-shell",
  workerSelector: {},
  size: null,
  usableWorkerPools: STORY_USABLE_WORKER_POOLS.map(ref),
  agent: null,
  placement: null,
  createdAt: "2026-11-21T09:12:00.000Z",
  updatedAt: "2026-11-21T09:12:00.000Z",
  crash: null,
  snapshots: [],
};

const STORY_ATESPACES: Atespace[] = [
  ...TESTBED_FLEET.atespaces,
  { name: SANDBOX_ATESPACE, uid: "9a7e3c1d-5b2f-4d8e-8f6a-1c3b5d7e9f20", createdAt: "2026-11-21T09:00:00.000Z" },
];

/** The actor template of the actor is gone. */
export const GONE_TEMPLATE_ACTOR: ActorRow = {
  ...structuredClone(PLAIN_ACTOR),
  name: "debug-shell-gone",
  uid: "7b3e9d21-4c6a-4f0e-9a8b-2d1c5e7f9a30",
  actorTemplate: "debug-shell-gone",
  workerSelector: null,
  usableWorkerPools: [],
};

const STORY_ACTORS: ActorRow[] = [
  ...TESTBED_FLEET.actors.map(({ name }) =>
    name === RUNNING_ACTOR.name ? RUNNING_ACTOR : name === CRASHED_ACTOR.name ? CRASHED_ACTOR : testbedActor(name)
  ),
  PLAIN_ACTOR,
];

const actorsByState = Object.fromEntries(actorStateGroupSchema.options.map((group) => [group, 0])) as Record<
  ActorStateGroup,
  number
>;
for (const actor of STORY_ACTORS) actorsByState[ACTOR_STATE_GROUP[actor.state]]++;

const GIB = 1024 ** 3;
const STORY_ROOM_SIZE: RoomSize = { cpuMillicores: 1000, memoryBytes: 2 * GIB };
const STORY_WORKER_LABELS: Labels = { workload: "workers" };

const TESTBED_WORKER: WorkerRow = TESTBED_FLEET.workers[0];

export const BUSY_WORKER: WorkerRow = {
  ...structuredClone(TESTBED_WORKER),
  name: RUNNING_ACTOR.placement!.worker,
  pod: RUNNING_ACTOR.placement!.workerPod,
  capacity: { cpuMillicores: 4000, memoryBytes: 8 * GIB, actors: 1000 },
  allocated: { cpuMillicores: 1000, memoryBytes: 2 * GIB, actors: 1 },
};

export const MICROVM_WORKER: WorkerRow = {
  ...structuredClone(TESTBED_WORKER),
  name: "5e2b8c41-7d3a-4f9e-b1c6-0a9d8e7f6c5b",
  workerPool: "workers-microvm",
  pod: "workers-microvm-6d4f8b7c9-x2k5p",
  capacity: { cpuMillicores: 8000, memoryBytes: 16 * GIB, actors: 1000 },
  allocated: { cpuMillicores: 0, memoryBytes: 0, actors: 0 },
  sandboxClasses: ["microvm"],
};

const STORY_WORKERS: WorkerRow[] = [TESTBED_WORKER, BUSY_WORKER, MICROVM_WORKER];

/** `room` and `limitedBy` as packages/trpc fleet/room.ts computes them. MicroVM runtime overhead: 4 Mi + 8 Mi per GiB. */
export const STORY_WORKER_POOLS: ReadyFleet["workerPools"] = {
  access: "ok",
  items: [
    {
      name: "workers",
      namespace: TESTBED_WORKER.workerNamespace,
      workers: [TESTBED_WORKER.name, BUSY_WORKER.name].sort(sortByName),
      capacity: {
        cpuMillicores: TESTBED_WORKER.capacity.cpuMillicores + BUSY_WORKER.capacity.cpuMillicores,
        memoryBytes: TESTBED_WORKER.capacity.memoryBytes + BUSY_WORKER.capacity.memoryBytes,
        actors: TESTBED_WORKER.capacity.actors + BUSY_WORKER.capacity.actors,
      },
      allocated: { ...BUSY_WORKER.allocated },
      workerLabels: { ...STORY_WORKER_LABELS },
      roomSize: { ...STORY_ROOM_SIZE },
      room: 1 + 3,
      limitedBy: ["cpu", "memory"],
      roomState: "room",
      resource: { desiredReplicas: 2, readyReplicas: 2, sandboxClass: "gvisor", resolution: "Resolved" },
    },
    {
      name: "workers-microvm",
      namespace: MICROVM_WORKER.workerNamespace,
      workers: [MICROVM_WORKER.name],
      capacity: { ...MICROVM_WORKER.capacity },
      allocated: { ...MICROVM_WORKER.allocated },
      workerLabels: { ...STORY_WORKER_LABELS },
      roomSize: { ...STORY_ROOM_SIZE },
      room: 7,
      limitedBy: ["memory"],
      roomState: "room",
      resource: { desiredReplicas: 1, readyReplicas: 1, sandboxClass: "microvm", resolution: "Resolved" },
    },
  ],
};

function crashedActorItem(actor: ActorRow): Extract<AttentionItem, { kind: "actorCrashed" }> {
  return {
    kind: "actorCrashed",
    severity: "error",
    atespace: actor.atespace,
    name: actor.name,
    message: actor.crash!.message,
    crashedAt: actor.crash!.at,
    agent: actor.agent && { issue: { ...actor.agent.issue }, agentProfile: actor.agent.agentProfile },
  };
}

export const CRASHED_ACTOR_ITEM = crashedActorItem(CRASHED_ACTOR);

/** The fleet `updatedAt` is more than 15 minutes after the last change of RUNNING_ACTOR. */
export const PENDING_SNAPSHOT_ITEM: AttentionItem = {
  kind: "snapshotPending",
  severity: "warning",
  atespace: RUNNING_ACTOR.atespace,
  name: RUNNING_ACTOR.name,
  generation: 2,
  updatedAt: RUNNING_ACTOR.updatedAt,
};

export const STORY_FLEET: ReadyFleet = {
  ...TESTBED_FLEET,
  summary: {
    ...TESTBED_FLEET.summary,
    atespaces: STORY_ATESPACES.length,
    agents: STORY_ACTORS.filter(({ agent }) => agent !== null).length,
    actors: STORY_ACTORS.length,
    actorsByState,
    workers: STORY_WORKERS.length,
    workersByState: { active: STORY_WORKERS.length, draining: 0, unavailable: 0, unknown: 0 },
  },
  atespaces: STORY_ATESPACES,
  actors: STORY_ACTORS,
  workers: STORY_WORKERS,
  workerPools: STORY_WORKER_POOLS,
  needsAttention: [CRASHED_ACTOR_ITEM, PENDING_SNAPSHOT_ITEM],
};

function storyActor(fleet: ReadyFleet, name: string): ActorRow {
  const actor = fleet.actors.find((row) => row.name === name);
  if (!actor) throw new Error(`story fleet has no actor ${name}`);
  return actor;
}

export const HEALTHY_FLEET: ReadyFleet = (() => {
  const fleet = structuredClone(STORY_FLEET);
  const crashed = storyActor(fleet, CRASHED_ACTOR.name);
  crashed.state = "suspended";
  crashed.crash = null;
  storyActor(fleet, RUNNING_ACTOR.name).snapshots.find(({ generation }) => generation === 2)!.durableState =
    "completed";
  fleet.summary.actorsByState.crashed -= 1;
  fleet.summary.actorsByState.suspended += 1;
  fleet.needsAttention = [];
  return fleet;
})();

export const CRASHED_ACTOR_FLEET: ReadyFleet = (() => {
  const fleet = structuredClone(HEALTHY_FLEET);
  fleet.actors = fleet.actors.map((actor) =>
    actor.name === CRASHED_ACTOR.name ? structuredClone(CRASHED_ACTOR) : actor
  );
  fleet.summary.actorsByState = { ...STORY_FLEET.summary.actorsByState };
  fleet.needsAttention = [CRASHED_ACTOR_ITEM];
  return fleet;
})();

export const PENDING_SNAPSHOT_FLEET: ReadyFleet = (() => {
  const fleet = structuredClone(HEALTHY_FLEET);
  fleet.actors = fleet.actors.map((actor) =>
    actor.name === RUNNING_ACTOR.name ? structuredClone(RUNNING_ACTOR) : actor
  );
  fleet.needsAttention = [PENDING_SNAPSHOT_ITEM];
  return fleet;
})();

export const MANY_CRASHED_COUNT = NEEDS_ATTENTION_MAX_ROWS + 2;

const FIRST_CRASH_MS = Date.parse("2026-11-22T21:00:00.000Z");

export const MANY_CRASHED_FLEET: ReadyFleet = (() => {
  const fleet = structuredClone(HEALTHY_FLEET);
  const crashedActors = Array.from({ length: MANY_CRASHED_COUNT }, (_, index): ActorRow => {
    const name = `crashed-${index + 1}`;
    return {
      ...structuredClone(PLAIN_ACTOR),
      name,
      uid: `uid-${name}`,
      actorTemplate: name,
      state: "crashed",
      crash: {
        message: `sandbox ${name} exited with code 1`,
        at: new Date(FIRST_CRASH_MS + index * 60_000).toISOString(),
      },
    };
  });
  fleet.actors.push(...crashedActors);
  fleet.summary.actors += crashedActors.length;
  fleet.summary.actorsByState.crashed += crashedActors.length;
  fleet.needsAttention = crashedActors.map(crashedActorItem);
  return fleet;
})();

export const SEVERAL_AGENT_PROFILES_FLEET: ReadyFleet = (() => {
  const fleet = structuredClone(HEALTHY_FLEET);
  storyActor(fleet, "issue-2-26").agent!.agentProfile = null;
  storyActor(fleet, "issue-6-3").agent!.agentProfile = "java";
  fleet.summary.agentsByProfile = [
    { agentProfile: "go", agents: 1 },
    { agentProfile: "java", agents: 1 },
    { agentProfile: "node", agents: 1 },
    { agentProfile: "python", agents: 2 },
    { agentProfile: null, agents: 1 },
  ];
  return fleet;
})();

export const FULL_WORKER_POOL_FLEET: ReadyFleet = (() => {
  const fleet = structuredClone(STORY_FLEET);
  for (const worker of fleet.workers) worker.allocated = { ...worker.capacity };
  for (const workerPool of fleet.workerPools.items) {
    workerPool.allocated = { ...workerPool.capacity };
    workerPool.room = 0;
    workerPool.limitedBy = ["actors", "cpu", "memory"];
    workerPool.roomState = "full";
  }
  return fleet;
})();

export const ONE_FULL_WORKER_POOL_FLEET: ReadyFleet = (() => {
  const fleet = structuredClone(HEALTHY_FLEET);
  const worker = fleet.workers.find(({ name }) => name === MICROVM_WORKER.name)!;
  worker.allocated = { cpuMillicores: 4000, memoryBytes: worker.capacity.memoryBytes, actors: 4 };
  const workerPool = fleet.workerPools.items.find(({ name }) => name === MICROVM_WORKER.workerPool)!;
  workerPool.allocated = { ...worker.allocated };
  workerPool.room = 0;
  workerPool.limitedBy = ["memory"];
  workerPool.roomState = "full";
  return fleet;
})();

export const ONE_WORKER_POOL_FLEET: ReadyFleet = (() => {
  const fleet = structuredClone(TESTBED_FLEET);
  fleet.workerPools.access = "ok";
  fleet.workerPools.items[0].resource = {
    desiredReplicas: 1,
    readyReplicas: 1,
    sandboxClass: "gvisor",
    resolution: "Resolved",
  };
  return fleet;
})();

function workerNotActiveItem(worker: WorkerRow, state: "draining" | "unavailable"): AttentionItem {
  return {
    kind: "workerNotActive",
    severity: state === "draining" ? "warning" : "error",
    name: worker.name,
    state,
    workerPool: worker.workerPool,
    workerNamespace: worker.workerNamespace,
  };
}

/** A draining worker adds no room to its worker pool. */
export const DRAINING_WORKER_FLEET: ReadyFleet = (() => {
  const fleet = structuredClone(STORY_FLEET);
  fleet.workers.find(({ name }) => name === BUSY_WORKER.name)!.state = "draining";
  fleet.summary.workersByState = { active: STORY_WORKERS.length - 1, draining: 1, unavailable: 0, unknown: 0 };
  fleet.workerPools.items[0].room = 1;
  fleet.needsAttention = [CRASHED_ACTOR_ITEM, workerNotActiveItem(BUSY_WORKER, "draining"), PENDING_SNAPSHOT_ITEM];
  return fleet;
})();

export const WORKERS_NOT_ACTIVE_FLEET: ReadyFleet = (() => {
  const fleet = structuredClone(DRAINING_WORKER_FLEET);
  fleet.workers.find(({ name }) => name === MICROVM_WORKER.name)!.state = "unavailable";
  fleet.summary.workersByState = { active: STORY_WORKERS.length - 2, draining: 1, unavailable: 1, unknown: 0 };
  const microvm = fleet.workerPools.items.find(({ name }) => name === MICROVM_WORKER.workerPool)!;
  microvm.roomSize = null;
  microvm.room = 0;
  microvm.limitedBy = [];
  microvm.roomState = "noWorker";
  withoutUsableWorkerPool(fleet, microvm.name);
  fleet.needsAttention = [
    CRASHED_ACTOR_ITEM,
    workerNotActiveItem(MICROVM_WORKER, "unavailable"),
    workerNotActiveItem(BUSY_WORKER, "draining"),
    PENDING_SNAPSHOT_ITEM,
  ];
  return fleet;
})();

export const NO_ATESPACES_DRAINING_WORKER_FLEET: ReadyFleet = (() => {
  const fleet = structuredClone(DRAINING_WORKER_FLEET);
  fleet.atespaces = [];
  fleet.actors = [];
  fleet.summary = {
    ...fleet.summary,
    atespaces: 0,
    agents: 0,
    agentsByProfile: [],
    actors: 0,
    actorsByState: { running: 0, transitional: 0, suspended: 0, crashed: 0, unknown: 0 },
  };
  fleet.needsAttention = [workerNotActiveItem(BUSY_WORKER, "draining")];
  return fleet;
})();

export const UNREGISTERED_WORKER_FLEET: ReadyFleet = (() => {
  const fleet = structuredClone(STORY_FLEET);
  fleet.workers.find(({ name }) => name === MICROVM_WORKER.name)!.registered = false;
  const microvm = fleet.workerPools.items.find(({ name }) => name === MICROVM_WORKER.workerPool)!;
  microvm.roomSize = null;
  microvm.room = 0;
  microvm.limitedBy = [];
  microvm.roomState = "noWorker";
  withoutUsableWorkerPool(fleet, microvm.name);
  return fleet;
})();

export const NOT_READY_FLEET: ReadyFleet = (() => {
  const fleet = structuredClone(STORY_FLEET);
  fleet.workerPools.items[0].resource!.readyReplicas = 1;
  fleet.workerPools.items.push({
    name: "workers-spare",
    namespace: TESTBED_WORKER.workerNamespace,
    workers: [],
    capacity: { cpuMillicores: 0, memoryBytes: 0, actors: 0 },
    allocated: { cpuMillicores: 0, memoryBytes: 0, actors: 0 },
    workerLabels: {},
    roomSize: null,
    room: 0,
    limitedBy: [],
    roomState: "noWorker",
    resource: { desiredReplicas: 2, readyReplicas: 0, sandboxClass: "gvisor", resolution: null },
  });
  fleet.needsAttention = [
    CRASHED_ACTOR_ITEM,
    ...[
      { name: "workers", readyReplicas: 1 },
      { name: "workers-spare", readyReplicas: 0 },
    ].map(({ name, readyReplicas }): AttentionItem => ({
      kind: "workerPoolNotReady",
      severity: "error",
      namespace: TESTBED_WORKER.workerNamespace,
      name,
      desiredReplicas: 2,
      readyReplicas,
    })),
    PENDING_SNAPSHOT_ITEM,
  ];
  return fleet;
})();

function withWorkerPoolAccess(access: "denied" | "error"): ReadyFleet {
  const fleet = structuredClone(STORY_FLEET);
  fleet.workerPools.access = access;
  for (const workerPool of fleet.workerPools.items) workerPool.resource = null;
  return fleet;
}

export const WORKER_POOLS_DENIED_FLEET = withWorkerPoolAccess("denied");
export const WORKER_POOLS_ERROR_FLEET = withWorkerPoolAccess("error");

/** WorkerPool list denied in the namespace of workers-microvm only. */
export const PARTIAL_WORKER_POOLS_FLEET: ReadyFleet = (() => {
  const fleet = structuredClone(STORY_FLEET);
  fleet.workerPools.access = "denied";
  const [workers, microvm] = fleet.workerPools.items;
  workers.resource!.readyReplicas = 1;
  microvm.resource = null;
  fleet.needsAttention = [
    CRASHED_ACTOR_ITEM,
    {
      kind: "workerPoolNotReady",
      severity: "error",
      namespace: workers.namespace,
      name: workers.name,
      desiredReplicas: 2,
      readyReplicas: 1,
    },
    PENDING_SNAPSHOT_ITEM,
  ];
  return fleet;
})();

const MIB = 1024 ** 2;

function roomStatesWorker(workerPool: string, capacity: WorkerRow["capacity"]): WorkerRow {
  const name = `${workerPool}-0`;
  return {
    ...structuredClone(TESTBED_WORKER),
    name,
    workerPool,
    pod: `${workerPool}-7c9f6-0`,
    capacity,
    allocated: { cpuMillicores: 0, memoryBytes: 0, actors: 0 },
  };
}

/** The worker pools of ROOM_STATES_FLEET that the `workload=workers` worker selector matches. */
const ROOM_STATES_USABLE_WORKER_POOLS = ["workers", "workers-busy", "workers-small"];

function placedAgent(name: string, agentProfile: string, worker: WorkerRow): ActorRow {
  const actor = testbedActor("issue-2-25");
  actor.name = name;
  actor.uid = `uid-${name}`;
  actor.actorTemplate = name;
  actor.state = "running";
  actor.agent!.agentProfile = agentProfile;
  actor.usableWorkerPools = ROOM_STATES_USABLE_WORKER_POOLS.map(ref);
  actor.snapshots = [];
  actor.placement = {
    worker: worker.name,
    workerPool: worker.workerPool,
    workerNamespace: worker.workerNamespace,
    workerPod: worker.pod,
    node: worker.node,
    sandboxRuntime: "gvisor",
  };
  worker.allocated.actors += 1;
  worker.allocated.cpuMillicores += 1000;
  worker.allocated.memoryBytes += 2 * GIB;
  return actor;
}

function resourceOf(desiredReplicas: number, readyReplicas: number): WorkerPoolRow["resource"] {
  return { desiredReplicas, readyReplicas, sandboxClass: "gvisor", resolution: "Resolved" };
}

/** Not made by the dispatcher: the one actor template that selects `workers-zero`, with no limits. */
const ZERO_CAPACITY_PROBE: ActorRow = {
  ...structuredClone(PLAIN_ACTOR),
  atespace: TESTBED_FLEET.atespaces[0].name,
  name: "capacity-probe",
  uid: "uid-capacity-probe",
  actorTemplate: "capacity-probe",
  state: "suspended",
  workerSelector: { workload: "zero" },
  usableWorkerPools: [ref("workers-zero")],
};

/**
 * One worker pool per room state; room size 1 CPU, 2 Gi where an agent's actor template selects the worker pool.
 * Worker pools with no room are warnings, `noTemplate` is muted; fleet room 3.
 */
export const ROOM_STATES_FLEET: ReadyFleet = (() => {
  const roomWorker = roomStatesWorker("workers", { cpuMillicores: 4000, memoryBytes: 8 * GIB, actors: 1000 });
  const busyWorker = roomStatesWorker("workers-busy", { cpuMillicores: 2000, memoryBytes: 4 * GIB, actors: 1000 });
  const smallWorker = roomStatesWorker("workers-small", { cpuMillicores: 500, memoryBytes: 448 * MIB, actors: 1000 });
  const zeroWorker = roomStatesWorker("workers-zero", { cpuMillicores: 4000, memoryBytes: 8 * GIB, actors: 0 });
  const unusedWorker = roomStatesWorker("workers-unused", { cpuMillicores: 4000, memoryBytes: 8 * GIB, actors: 1000 });
  const agents = [
    placedAgent("issue-7-1", "go", roomWorker),
    placedAgent("issue-7-2", "go", busyWorker),
    placedAgent("issue-7-3", "python", busyWorker),
  ];
  const actors = [...agents, structuredClone(ZERO_CAPACITY_PROBE)];
  const workers = [roomWorker, busyWorker, smallWorker, zeroWorker, unusedWorker];
  const poolOf = (
    worker: WorkerRow,
    row: Pick<WorkerPoolRow, "room" | "limitedBy" | "roomState">,
    workerLabels: Labels = STORY_WORKER_LABELS,
    roomSize: RoomSize | null = STORY_ROOM_SIZE
  ): WorkerPoolRow => ({
    name: worker.workerPool,
    namespace: AGENTS_NAMESPACE,
    workers: [worker.name],
    capacity: { ...worker.capacity },
    allocated: { ...worker.allocated },
    workerLabels: { ...workerLabels },
    roomSize: roomSize && { ...roomSize },
    ...row,
    resource: resourceOf(1, 1),
  });

  return {
    ...TESTBED_FLEET,
    summary: {
      ...TESTBED_FLEET.summary,
      agents: agents.length,
      agentsByProfile: [
        { agentProfile: "go", agents: 2 },
        { agentProfile: "python", agents: 1 },
      ],
      actors: actors.length,
      actorsByState: { running: agents.length, transitional: 0, suspended: 1, crashed: 0, unknown: 0 },
      workers: workers.length,
      workersByState: { active: workers.length, draining: 0, unavailable: 0, unknown: 0 },
    },
    actors,
    workers,
    workerPools: {
      access: "ok",
      items: [
        poolOf(roomWorker, { room: 3, limitedBy: ["cpu", "memory"], roomState: "room" }),
        poolOf(busyWorker, { room: 0, limitedBy: ["cpu", "memory"], roomState: "full" }),
        poolOf(smallWorker, { room: 0, limitedBy: ["cpu", "memory"], roomState: "tooSmall" }),
        {
          name: "workers-spare",
          namespace: AGENTS_NAMESPACE,
          workers: [],
          capacity: { cpuMillicores: 0, memoryBytes: 0, actors: 0 },
          allocated: { cpuMillicores: 0, memoryBytes: 0, actors: 0 },
          workerLabels: {},
          roomSize: null,
          room: 0,
          limitedBy: [],
          roomState: "noWorker",
          resource: resourceOf(1, 0),
        },
        poolOf(unusedWorker, { room: 0, limitedBy: [], roomState: "noTemplate" }, { workload: "unused" }, null),
        poolOf(zeroWorker, { room: 0, limitedBy: ["actors"], roomState: "tooSmall" }, { workload: "zero" }, null),
      ],
    },
    needsAttention: [
      {
        kind: "workerPoolNotReady",
        severity: "error",
        namespace: AGENTS_NAMESPACE,
        name: "workers-spare",
        desiredReplicas: 1,
        readyReplicas: 0,
      },
    ],
  };
})();

export const NO_ROOM_STATES_FLEET: ReadyFleet = (() => {
  const fleet = structuredClone(ROOM_STATES_FLEET);
  const worker = fleet.workers.find(({ workerPool }) => workerPool === "workers")!;
  const added = ["issue-7-4", "issue-7-5", "issue-7-6"].map((name) => placedAgent(name, "node", worker));
  fleet.actors.push(...added);
  fleet.summary.agents += added.length;
  fleet.summary.actors += added.length;
  fleet.summary.actorsByState.running += added.length;
  fleet.summary.agentsByProfile = [
    { agentProfile: "go", agents: 2 },
    { agentProfile: "node", agents: added.length },
    { agentProfile: "python", agents: 1 },
  ];
  const workerPool = fleet.workerPools.items.find(({ name }) => name === "workers")!;
  workerPool.allocated = { ...worker.allocated };
  workerPool.room = 0;
  workerPool.roomState = "full";
  return fleet;
})();

/**
 * The testbed: `workers` has room for 1 actor; `workers-small` (`workload=workers-small`, 500m CPU, 512 Mi) is too
 * small for an agent, but no actor template selects it.
 */
export const NO_TEMPLATE_FLEET: ReadyFleet = (() => {
  const fleet = structuredClone(ONE_WORKER_POOL_FLEET);
  const worker: WorkerRow = {
    ...structuredClone(TESTBED_WORKER),
    name: "workers-small-0",
    workerPool: "workers-small",
    pod: "workers-small-5f7d9-0",
    capacity: { cpuMillicores: 500, memoryBytes: 512 * MIB, actors: 1000 },
    allocated: { cpuMillicores: 0, memoryBytes: 0, actors: 0 },
  };
  fleet.workers.push(worker);
  fleet.summary.workers += 1;
  fleet.summary.workersByState.active += 1;
  fleet.workerPools.items.push({
    name: worker.workerPool,
    namespace: worker.workerNamespace,
    workers: [worker.name],
    capacity: { ...worker.capacity },
    allocated: { ...worker.allocated },
    workerLabels: { workload: "workers-small" },
    roomSize: null,
    room: 0,
    limitedBy: [],
    roomState: "noTemplate",
    resource: resourceOf(1, 1),
  });
  return fleet;
})();

const LARGE_SIZE: RoomSize = { cpuMillicores: 2000, memoryBytes: 4 * GIB };

/** Selects `workers-microvm` only, at 2 CPU, 4 Gi. */
export const LARGE_ACTOR: ActorRow = (() => {
  const actor = testbedActor("issue-6-3");
  actor.name = "issue-8-1";
  actor.uid = "uid-issue-8-1";
  actor.actorTemplate = "issue-8-1";
  actor.state = "suspended";
  actor.workerSelector = { workload: "workers-large" };
  actor.size = { ...LARGE_SIZE };
  actor.usableWorkerPools = [ref("workers-microvm")];
  actor.snapshots = [];
  return actor;
})();

/**
 * `workers` at 1 CPU, 2 Gi for the testbed actor templates; `workers-microvm`, labelled `workload=workers-large`, at
 * 2 CPU, 4 Gi for LARGE_ACTOR. MicroVM runtime overhead of 4 Gi: 36 Mi.
 */
export const TWO_ROOM_SIZES_FLEET: ReadyFleet = (() => {
  const fleet = structuredClone(HEALTHY_FLEET);
  for (const actor of fleet.actors) {
    if (actor.workerSelector?.workload === "workers") actor.usableWorkerPools = [ref("workers")];
  }
  fleet.actors.push(structuredClone(LARGE_ACTOR));
  fleet.summary.actors += 1;
  fleet.summary.agents += 1;
  fleet.summary.actorsByState.suspended += 1;
  fleet.summary.agentsByProfile = fleet.summary.agentsByProfile.map((entry) =>
    entry.agentProfile === LARGE_ACTOR.agent!.agentProfile ? { ...entry, agents: entry.agents + 1 } : entry
  );
  const microvm = fleet.workerPools.items.find(({ name }) => name === MICROVM_WORKER.workerPool)!;
  microvm.workerLabels = { workload: "workers-large" };
  microvm.roomSize = { ...LARGE_SIZE };
  microvm.room = 3;
  microvm.limitedBy = ["memory"];
  return fleet;
})();

/** The worker selector `workload=wokers` matches no worker of HEALTHY_FLEET. */
export const UNSCHEDULABLE_ACTOR: ActorRow = (() => {
  const actor = testbedActor("issue-6-2");
  actor.workerSelector = { workload: "wokers" };
  actor.usableWorkerPools = [];
  actor.agent!.codebase = { name: "test-node-app", namespace: PLATFORM_NAMESPACE };
  actor.agent!.issue.url = "https://gitlab.example.com/krci/test-node-app/-/issues/2";
  return actor;
})();

export const UNSCHEDULABLE_ACTOR_FLEET: ReadyFleet = (() => {
  const fleet = structuredClone(HEALTHY_FLEET);
  fleet.actors = fleet.actors.map((actor) =>
    actor.name === UNSCHEDULABLE_ACTOR.name ? structuredClone(UNSCHEDULABLE_ACTOR) : actor
  );
  fleet.needsAttention = [
    {
      kind: "actorUnschedulable",
      severity: "error",
      atespace: UNSCHEDULABLE_ACTOR.atespace,
      name: UNSCHEDULABLE_ACTOR.name,
      workerSelector: { ...UNSCHEDULABLE_ACTOR.workerSelector },
      agent: {
        issue: { ...UNSCHEDULABLE_ACTOR.agent!.issue },
        agentProfile: UNSCHEDULABLE_ACTOR.agent!.agentProfile,
      },
    },
  ];
  return fleet;
})();

export function seedFleet(fleet: FleetData) {
  return (queryClient: QueryClient) => {
    queryClient.setQueryData(FLEET_QUERY_KEY, fleet);
  };
}
