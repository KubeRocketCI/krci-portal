import { z } from "zod";

const count = z.number().int().nonnegative();

/**
 * The Agent Substrate actor states.
 * `transitional`: a state that Agent Substrate does not name. `unknown`: the actor state cannot be read.
 */
export const actorStateSchema = z.enum([
  "resuming",
  "running",
  "suspending",
  "suspended",
  "crashed",
  "deleting",
  "reverting",
  "transitional",
  "unknown",
]);

/** The summary groups of actor states. `transitional`: resuming, suspending, deleting, reverting, transitional. */
export const actorStateGroupSchema = z.enum(["running", "transitional", "suspended", "crashed", "unknown"]);

export const workerStateSchema = z.enum(["active", "draining", "unavailable", "unknown"]);

/** Ordered from least to most restored state: volumes < rootfs < memory. */
export const snapshotFidelitySchema = z.enum(["volumes", "rootfs", "memory", "unknown"]);

/** `none`: the snapshot has no durable copy. `pending`: the upload is not complete. */
export const snapshotDurableStateSchema = z.enum(["none", "pending", "completed", "unknown"]);

export const fleetUnreachableReasonSchema = z.enum(["unavailable", "unauthenticated", "permissionDenied", "other"]);

export const workerPoolAccessSchema = z.enum(["ok", "denied", "error"]);

export const substrateResourcesSchema = z.object({
  cpuMillicores: count,
  memoryBytes: count,
  actors: count,
});

/** The actor template size that room is counted in. */
export const roomSizeSchema = z.object({
  cpuMillicores: count,
  memoryBytes: count,
});

export const atespaceSchema = z.object({
  name: z.string(),
  uid: z.string(),
  createdAt: z.string(),
});

export const actorIssueSchema = z.object({
  projectPath: z.string(),
  projectId: z.string(),
  iid: z.string(),
  /** Null when no Codebase matches the project path. */
  url: z.string().nullable(),
});

/** A Codebase that the user can read. */
export const codebaseRefSchema = z.object({
  name: z.string(),
  namespace: z.string(),
});

/** Null on an actor that the dispatcher did not make. */
export const actorAgentSchema = z.object({
  issue: actorIssueSchema,
  codebase: codebaseRefSchema.nullable(),
  agentProfile: z.string().nullable(),
  model: z.string().nullable(),
});

/** Null while the actor is suspended or crashed. */
export const actorPlacementSchema = z.object({
  worker: z.string(),
  workerPool: z.string(),
  workerNamespace: z.string(),
  pod: z.string(),
  node: z.string(),
  sandboxRuntime: z.string().nullable(),
});

export const actorCrashSchema = z.object({
  message: z.string(),
  at: z.string().nullable(),
});

export const actorSnapshotSchema = z.object({
  uuid: z.string(),
  generation: count,
  fidelity: snapshotFidelitySchema,
  /** The node that holds the local files. Null when no node holds them. */
  locality: z.string().nullable(),
  durableState: snapshotDurableStateSchema,
});

export const actorRowSchema = z.object({
  atespace: z.string(),
  name: z.string(),
  uid: z.string(),
  state: actorStateSchema,
  actorTemplate: z.string(),
  agent: actorAgentSchema.nullable(),
  placement: actorPlacementSchema.nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  crash: actorCrashSchema.nullable(),
  snapshots: z.array(actorSnapshotSchema),
});

export const workerRowSchema = z.object({
  name: z.string(),
  workerPool: z.string(),
  workerNamespace: z.string(),
  pod: z.string(),
  node: z.string(),
  state: workerStateSchema,
  capacity: substrateResourcesSchema,
  allocated: substrateResourcesSchema,
  sandboxClasses: z.array(z.string()),
});

export const workerPoolRowSchema = z.object({
  name: z.string(),
  namespace: z.string(),
  desiredReplicas: count,
  readyReplicas: count,
  sandboxClass: z.string().nullable(),
  /** The `Resolved` condition reason. Null when the WorkerPool has no condition yet. */
  resolution: z.string().nullable(),
  capacity: substrateResourcesSchema,
  allocated: substrateResourcesSchema,
  room: count,
  /** Null when no actor template exists: room is then the free actor slots. */
  roomSize: roomSizeSchema.nullable(),
});

function countsBy<T extends [string, ...string[]]>(values: z.ZodEnum<T>) {
  return z.object(Object.fromEntries(values.options.map((value) => [value, count])) as Record<T[number], z.ZodNumber>);
}

export const fleetSummarySchema = z.object({
  atespaces: count,
  /** Actors that serve an issue. */
  agents: count,
  actors: count,
  actorsByState: countsBy(actorStateGroupSchema),
  workers: count,
  workersByState: countsBy(workerStateSchema),
});

export const attentionItemSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("actorCrashed"),
    atespace: z.string(),
    name: z.string(),
    message: z.string(),
    at: z.string().nullable(),
  }),
  z.object({
    kind: z.literal("workerPoolNotReady"),
    namespace: z.string(),
    name: z.string(),
    desiredReplicas: count,
    readyReplicas: count,
  }),
  z.object({
    kind: z.literal("workerNotActive"),
    name: z.string(),
    state: workerStateSchema,
  }),
  z.object({
    kind: z.literal("snapshotNotDurable"),
    atespace: z.string(),
    name: z.string(),
    generation: count,
  }),
]);

export const fleetSnapshotSchema = z.discriminatedUnion("state", [
  z.object({ state: z.literal("notConfigured") }),
  /** The error message stays in the portal server log. */
  z.object({
    state: z.literal("unreachable"),
    reason: fleetUnreachableReasonSchema,
  }),
  z.object({
    state: z.literal("ready"),
    updatedAt: z.string(),
    summary: fleetSummarySchema,
    atespaces: z.array(atespaceSchema),
    actors: z.array(actorRowSchema),
    workers: z.array(workerRowSchema),
    workerPools: z.object({
      access: workerPoolAccessSchema,
      items: z.array(workerPoolRowSchema),
    }),
    needsAttention: z.array(attentionItemSchema),
  }),
]);
