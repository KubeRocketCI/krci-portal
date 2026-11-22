import type {
  ActorState,
  SnapshotDurableState,
  SnapshotFidelity,
  SubstrateResources,
  WorkerState,
} from "@my-project/shared";

export interface SubstrateObjectRef {
  atespace: string;
  name: string;
}

export interface SubstrateAtespace {
  name: string;
  uid: string;
  createTime: string;
}

export interface SubstrateWorkerAssignment {
  worker: string;
  workerPool: string;
  workerNamespace: string;
  workerPod: string;
  nodeName: string;
  sandboxRuntime: string | null;
}

export interface SubstrateSnapshot {
  uuid: string;
  generation: number;
  fidelity: SnapshotFidelity;
  locality: string | null;
  durableState: SnapshotDurableState;
}

export interface SubstrateActor {
  atespace: string;
  name: string;
  uid: string;
  createTime: string;
  updateTime: string;
  actorTemplate: SubstrateObjectRef;
  state: ActorState;
  /** Unset while the actor is suspended or crashed. */
  workerAssignment: SubstrateWorkerAssignment | null;
  crash: { message: string; crashTime: string | null } | null;
  snapshots: SubstrateSnapshot[];
}

export interface SubstrateEnvVar {
  name: string;
  value: string;
}

export interface SubstrateActorTemplate {
  atespace: string;
  name: string;
  uid: string;
  containers: { name: string; env: SubstrateEnvVar[] }[];
  limits: { cpuMillicores: number; memoryBytes: number };
}

export interface SubstrateWorker {
  name: string;
  workerPool: string;
  workerNamespace: string;
  workerPod: string;
  nodeName: string;
  state: WorkerState;
  capacity: SubstrateResources;
  allocated: SubstrateResources;
  sandboxClasses: string[];
}

export type AgentSubstrateSourceErrorKind =
  | "unauthenticated"
  | "permissionDenied"
  | "unavailable"
  | "notFound"
  | "other";

/**
 * The only error an `AgentSubstrateSource` read rejects with. `unavailable` covers network and TLS failures.
 * `notFound`: the named object does not exist.
 */
export class AgentSubstrateSourceError extends Error {
  readonly kind: AgentSubstrateSourceErrorKind;

  constructor(kind: AgentSubstrateSourceErrorKind, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "AgentSubstrateSourceError";
    this.kind = kind;
  }
}

/**
 * Read-only port to one Agent Substrate. Every read covers all atespaces and all pages.
 * Each call rejects only with `AgentSubstrateSourceError`.
 */
export interface AgentSubstrateSource {
  listAtespaces(): Promise<SubstrateAtespace[]>;
  listActors(): Promise<SubstrateActor[]>;
  /** Actor templates are immutable: a result for one uid stays valid. */
  getActorTemplate(ref: SubstrateObjectRef): Promise<SubstrateActorTemplate>;
  listWorkers(): Promise<SubstrateWorker[]>;
}
