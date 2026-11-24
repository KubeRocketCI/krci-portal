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

export const agentIssueSchema = z.object({
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
  issue: agentIssueSchema,
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
  /** False until the worker registers with Agent Substrate and reports a sandbox class: it hosts no actor. */
  registered: z.boolean(),
});

export const workerPoolResourceSchema = z.object({
  desiredReplicas: count,
  readyReplicas: count,
  sandboxClass: z.string().nullable(),
  /** The `Resolved` condition reason. Null when the WorkerPool has no condition yet. */
  resolution: z.string().nullable(),
});

/** A worker resource that bounds room: `actors` is the actor capacity of the worker. */
export const roomResourceSchema = z.enum(["actors", "cpu", "memory"]);

/**
 * Room state of a worker pool, over its active, registered workers.
 * `room`: room above 0. `full`: room 0; at least one worker fits an actor of the room size when it hosts no actor.
 * `tooSmall`: room 0; no worker fits an actor of the room size even when it hosts no actor.
 * `noWorker`: no worker is active and registered.
 */
export const roomStateSchema = z.enum(["room", "full", "tooSmall", "noWorker"]);

export const workerPoolRowSchema = z.object({
  name: z.string(),
  namespace: z.string(),
  /** Sorted by name. */
  workers: z.array(z.string()),
  /** Sum over the workers. */
  capacity: substrateResourcesSchema,
  allocated: substrateResourcesSchema,
  /** Actors of the room size that the active, registered workers can still host. */
  room: count,
  /**
   * The resources that bound room on at least one active, registered worker: on a worker, the resources whose free
   * amount fits the fewest actors of the room size. In the order actors, cpu, memory. Empty when no worker is active
   * and registered.
   */
  limitedBy: z.array(roomResourceSchema),
  roomState: roomStateSchema,
  /** Null when the WorkerPool list of the namespace was not read or no WorkerPool has this name. */
  resource: workerPoolResourceSchema.nullable(),
});

function countsBy<T extends [string, ...string[]]>(values: z.ZodEnum<T>) {
  return z.object(Object.fromEntries(values.options.map((value) => [value, count])) as Record<T[number], z.ZodNumber>);
}

/** `agentProfile` null: agents whose actor template sets no `AGENT_PROFILE`. */
export const agentProfileCountSchema = z.object({
  agentProfile: z.string().nullable(),
  agents: count,
});

export const fleetSummarySchema = z.object({
  atespaces: count,
  /** Actors that serve an issue. */
  agents: count,
  /** By agent profile name, the null agent profile last; only agent profiles with agents. Sums to `agents`. */
  agentsByProfile: z.array(agentProfileCountSchema),
  actors: count,
  actorsByState: countsBy(actorStateGroupSchema),
  workers: count,
  workersByState: countsBy(workerStateSchema),
});

/** `error`: work stops now. `warning`: can clear on its own. */
export const attentionSeveritySchema = z.enum(["error", "warning"]);

export const attentionKindSchema = z.enum(["actorCrashed", "workerPoolNotReady", "workerNotActive", "snapshotPending"]);

export const attentionAgentSchema = actorAgentSchema.pick({ issue: true, agentProfile: true });

export const attentionItemSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal(attentionKindSchema.enum.actorCrashed),
    severity: z.literal(attentionSeveritySchema.enum.error),
    atespace: z.string(),
    name: z.string(),
    message: z.string(),
    crashedAt: z.string().nullable(),
    /** Null on an actor that the dispatcher did not make. */
    agent: attentionAgentSchema.nullable(),
  }),
  z.object({
    kind: z.literal(attentionKindSchema.enum.workerPoolNotReady),
    severity: z.literal(attentionSeveritySchema.enum.error),
    namespace: z.string(),
    name: z.string(),
    desiredReplicas: count,
    readyReplicas: count,
  }),
  /** `error` when unavailable or unknown, `warning` when draining. */
  z.object({
    kind: z.literal(attentionKindSchema.enum.workerNotActive),
    severity: attentionSeveritySchema,
    name: z.string(),
    state: workerStateSchema.exclude(["active"]),
    workerPool: z.string(),
    workerNamespace: z.string(),
  }),
  /**
   * The latest snapshot generation of an actor is pending and the actor last changed more than 15 minutes ago, or its
   * last change does not parse.
   */
  z.object({
    kind: z.literal(attentionKindSchema.enum.snapshotPending),
    severity: z.literal(attentionSeveritySchema.enum.warning),
    atespace: z.string(),
    name: z.string(),
    generation: count,
    /** The last change of the actor. Null when it does not parse. */
    updatedAt: z.string().nullable(),
  }),
]);

export const fleetSchema = z.discriminatedUnion("state", [
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
      /** By namespace, then name. */
      items: z.array(workerPoolRowSchema),
      /** The largest CPU and memory limits over the actor templates. Null when no template sets a limit: room counts actors only. */
      roomSize: roomSizeSchema.nullable(),
    }),
    /** Errors before warnings, then by kind, then oldest first; an item with no time after the timed ones, by name. */
    needsAttention: z.array(attentionItemSchema),
  }),
]);
