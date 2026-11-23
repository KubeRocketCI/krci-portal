import type { QueryClient } from "@tanstack/react-query";
import {
  ACTOR_STATE_GROUP,
  actorStateGroupSchema,
  sortByName,
  type ActorRow,
  type ActorStateGroup,
  type Atespace,
  type FleetSnapshot,
  type ReadyFleetSnapshot,
  type WorkerRow,
} from "@my-project/shared";
import { FLEET_QUERY_KEY } from "../hooks/useFleet";
import testbedFleet from "./fleet.testbed.json";

/** `DEFAULT_CLUSTER_NAMESPACE` of the portal: the namespace of the Codebases. */
const PLATFORM_NAMESPACE = "krci";

/** Recorded on the testbed by packages/trpc/scripts/record-agent-substrate-fixtures.ts. */
export const TESTBED_FLEET = testbedFleet as ReadyFleetSnapshot;

export const EMPTY_FLEET: ReadyFleetSnapshot = {
  ...TESTBED_FLEET,
  summary: {
    atespaces: 0,
    agents: 0,
    actors: 0,
    actorsByState: { running: 0, transitional: 0, suspended: 0, crashed: 0, unknown: 0 },
    workers: 0,
    workersByState: { active: 0, draining: 0, unavailable: 0, unknown: 0 },
  },
  atespaces: [],
  actors: [],
  workers: [],
  workerPools: { access: "ok", items: [], roomSize: null },
  needsAttention: [],
};

const SANDBOX_ATESPACE = "krci-sandbox";

function testbedActor(name: string): ActorRow {
  const actor = TESTBED_FLEET.actors.find((row) => row.name === name);
  if (!actor) throw new Error(`testbed fixture has no actor ${name}`);
  return structuredClone(actor);
}

/** issue-2-25: running, its Codebase readable, a pending second snapshot. */
export const RUNNING_ACTOR: ActorRow = (() => {
  const actor = testbedActor("issue-2-25");
  actor.state = "running";
  actor.agent!.codebase = { name: "test-go-app", namespace: PLATFORM_NAMESPACE };
  actor.agent!.issue.url = "https://gitlab.example.com/krci/test-go-app/-/issues/25";
  actor.placement = {
    worker: "workers-7c9f6",
    workerPool: "workers",
    workerNamespace: "krci-agents",
    pod: "workers-7c9f6-0",
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

/** issue-5-4: crashed, its Codebase readable. */
export const CRASHED_ACTOR: ActorRow = (() => {
  const actor = testbedActor("issue-5-4");
  actor.state = "crashed";
  actor.agent!.codebase = { name: "test-python-app", namespace: PLATFORM_NAMESPACE };
  actor.agent!.issue.url = "https://gitlab.example.com/krci/test-python-app/-/issues/4";
  actor.crash = { message: "sandbox exited with code 137: out of memory", at: "2026-11-22T21:40:11.000Z" };
  return actor;
})();

/** Not made by the dispatcher; Agent Substrate reports no actor state. */
export const PLAIN_ACTOR: ActorRow = {
  atespace: SANDBOX_ATESPACE,
  name: "debug-shell",
  uid: "0c7d1a52-91a4-4c1b-a7a3-3a8f5d0e2b6f",
  state: "unknown",
  actorTemplate: "debug-shell",
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

const STORY_ACTORS: ActorRow[] = [
  ...TESTBED_FLEET.actors.map((actor) =>
    actor.name === RUNNING_ACTOR.name ? RUNNING_ACTOR : actor.name === CRASHED_ACTOR.name ? CRASHED_ACTOR : actor
  ),
  PLAIN_ACTOR,
];

const actorsByState = Object.fromEntries(actorStateGroupSchema.options.map((group) => [group, 0])) as Record<
  ActorStateGroup,
  number
>;
for (const actor of STORY_ACTORS) actorsByState[ACTOR_STATE_GROUP[actor.state]]++;

const GIB = 1024 ** 3;

const TESTBED_WORKER: WorkerRow = TESTBED_FLEET.workers[0];

export const BUSY_WORKER: WorkerRow = {
  ...structuredClone(TESTBED_WORKER),
  name: RUNNING_ACTOR.placement!.worker,
  pod: RUNNING_ACTOR.placement!.pod,
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

/** `room` as `roomOf` (packages/trpc fleet/room.ts) gives it; microVM runtime overhead 4 Mi + 8 Mi per GiB. */
export const STORY_WORKER_POOLS: ReadyFleetSnapshot["workerPools"] = {
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
      room: 1 + 3,
      resource: { desiredReplicas: 2, readyReplicas: 2, sandboxClass: "gvisor", resolution: "Resolved" },
    },
    {
      name: "workers-microvm",
      namespace: MICROVM_WORKER.workerNamespace,
      workers: [MICROVM_WORKER.name],
      capacity: { ...MICROVM_WORKER.capacity },
      allocated: { ...MICROVM_WORKER.allocated },
      room: 7,
      resource: { desiredReplicas: 1, readyReplicas: 1, sandboxClass: "microvm", resolution: "Resolved" },
    },
  ],
  roomSize: { cpuMillicores: 1000, memoryBytes: 2 * GIB },
};

export const STORY_FLEET: ReadyFleetSnapshot = {
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
};

export const FULL_WORKER_POOL_FLEET: ReadyFleetSnapshot = (() => {
  const fleet = structuredClone(STORY_FLEET);
  for (const worker of fleet.workers) worker.allocated = { ...worker.capacity };
  for (const pool of fleet.workerPools.items) {
    pool.allocated = { ...pool.capacity };
    pool.room = 0;
  }
  return fleet;
})();

/** A draining worker adds no room to its worker pool. */
export const DRAINING_WORKER_FLEET: ReadyFleetSnapshot = (() => {
  const fleet = structuredClone(STORY_FLEET);
  fleet.workers.find(({ name }) => name === BUSY_WORKER.name)!.state = "draining";
  fleet.summary.workersByState = { active: STORY_WORKERS.length - 1, draining: 1, unavailable: 0, unknown: 0 };
  fleet.workerPools.items[0].room = 1;
  return fleet;
})();

/** MICROVM_WORKER active but not registered: its worker pool has no room. */
export const UNREGISTERED_WORKER_FLEET: ReadyFleetSnapshot = (() => {
  const fleet = structuredClone(STORY_FLEET);
  fleet.workers.find(({ name }) => name === MICROVM_WORKER.name)!.registered = false;
  fleet.workerPools.items.find(({ name }) => name === MICROVM_WORKER.workerPool)!.room = 0;
  return fleet;
})();

export const NOT_READY_FLEET: ReadyFleetSnapshot = (() => {
  const fleet = structuredClone(STORY_FLEET);
  fleet.workerPools.items[0].resource!.readyReplicas = 1;
  fleet.workerPools.items.push({
    name: "workers-spare",
    namespace: TESTBED_WORKER.workerNamespace,
    workers: [],
    capacity: { cpuMillicores: 0, memoryBytes: 0, actors: 0 },
    allocated: { cpuMillicores: 0, memoryBytes: 0, actors: 0 },
    room: 0,
    resource: { desiredReplicas: 2, readyReplicas: 0, sandboxClass: "gvisor", resolution: null },
  });
  return fleet;
})();

function withWorkerPoolAccess(access: "denied" | "error"): ReadyFleetSnapshot {
  const fleet = structuredClone(STORY_FLEET);
  fleet.workerPools.access = access;
  for (const pool of fleet.workerPools.items) pool.resource = null;
  return fleet;
}

export const WORKER_POOLS_DENIED_FLEET = withWorkerPoolAccess("denied");
export const WORKER_POOLS_ERROR_FLEET = withWorkerPoolAccess("error");

export function seedFleet(snapshot: FleetSnapshot) {
  return (queryClient: QueryClient) => {
    queryClient.setQueryData(FLEET_QUERY_KEY, snapshot);
  };
}
