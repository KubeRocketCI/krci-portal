/**
 * Hint texts of Factory mode: one or two sentences, a fact. A glossary term follows its GLOSSARY.md definition; an
 * Agent Substrate field follows its comment in `packages/trpc/proto/ateapi/v1/ateapi.proto`.
 */

export const PAGE_DESCRIPTION = {
  overview: "The Factory fleet: what needs attention, its counts and the room of each worker pool.",
  agents: "The actors that host an agent: one row for each issue.",
  actors: "Isolated Factory sandboxes whose state survives suspend and resume. An agent runs in one actor.",
  actorDetail: "One actor: its agent, actor template, worker and snapshots.",
  agentDetail: "One agent: the issue it works on, its agent profile and the actor it runs in.",
  workerPools: "Sets of workers of one size and sandbox class, and the room each has for actors.",
} as const;

export const SECTION_HINT = {
  needsAttention:
    "Crashed actors, actors no worker pool can host, worker pools with fewer ready replicas than desired, workers that are not active and pending snapshots.",
  atAGlance: "Actors, workers and fleet room at the last read of Factory.",
  capacity: "Room, allocation and capacity of each worker pool, summed over its workers.",
} as const;

export const TERM_HINT = {
  atespace: "A named group of actors and actor templates that shares one set of access rules.",
  actorTemplate:
    "The fixed recipe an actor starts from: image, environment and size. The dispatcher makes one per issue.",
  actorState:
    "The lifecycle state of an actor. Suspended: it holds no worker, as between agent turns or after a resume that found no room.",
  agentProfile: "The kind of agent an issue gets, such as go, python or node. The dispatcher maps each project to one.",
  agentImage: "The image an actor runs: the tools of one kind of agent and the image side of its agent profile.",
  sandboxClass:
    "The sandbox runtime family of a worker pool, gvisor or microvm. The first snapshot records it; the actor runs only on that class afterwards.",
  snapshotFidelity:
    "Preferred: what the actor template asks a snapshot to hold. Newest: what the latest snapshot holds.",
  canRunOn: "Worker pools with an active, registered worker whose labels the worker selector matches.",
  size: "CPU and memory limits of the actor template. A worker books them plus the runtime overhead.",
  workerSelector: "Labels a worker must have to host this actor. Every key must match.",
  workerLabels: "Labels of the WorkerPool, copied to its workers. Worker selectors match against them.",
  workerPool: "A set of workers of one size and sandbox class, kept at a desired number of replicas.",
  replicas: "Workers desired and ready.",
  room: "Actors of the room size that can still start.",
  roomSize: "The largest CPU and memory limits over the actor templates that can use this worker pool.",
  limitedBy: "The worker resources that bound room: those whose free amount fits the fewest actors of the room size.",
  sandboxRuntime:
    "The sandbox runtime and compatibility version the actor was started or restored under on this worker.",
  generation: "The generation number of the snapshot, increasing from 1.",
  fidelity: "What the snapshot holds: volumes, root filesystem changes or process memory.",
  locality: "The Kubernetes node holding the snapshot files. Detach, revert or a later checkpoint clears it.",
  egressRule:
    "HTTPS and HTTP: the egress gateway reads each request and can add credentials. TLS passthrough: it forwards the traffic without decryption.",
  egressCredentials:
    "Request headers whose placeholder value the egress gateway replaces with a credential when the actor sends them, with the prefix of the credential.",
  durableState:
    "The durable storage copy of the snapshot: pending while it is uploaded, completed once the upload is recorded.",
} as const;
