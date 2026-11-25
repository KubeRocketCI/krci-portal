import { sortByName, type ActorAgent, type FleetUnreachableReason } from "@my-project/shared";
import {
  AgentSubstrateSourceError,
  type AgentSubstrateSource,
  type SubstrateActor,
  type SubstrateActorTemplate,
  type SubstrateAtespace,
  type SubstrateWorker,
} from "../../../clients/agentSubstrate/index.js";
import { mapWithConcurrency } from "../../../utils/mapWithConcurrency/index.js";
import { WORKER_NAMESPACES } from "./workerNamespaces.js";

/** One read serves every signed-in user (ADR 0002). */
const SHARED_READ_TTL_MS = 5_000;
const ACTOR_TEMPLATE_READ_CONCURRENCY = 8;

/** The only actor template env values that leave the server (ADR 0001). */
export const AGENT_ENV = {
  projectPath: "PROJECT_PATH",
  projectId: "PROJECT_ID",
  issueIid: "ISSUE_IID",
  agentProfile: "AGENT_PROFILE",
  model: "ANTHROPIC_MODEL",
  turnLimit: "TURN_LIMIT",
} as const;

interface ActorTemplateFacts {
  /** Null on an actor that the dispatcher did not make. */
  agent: ActorAgent | null;
  /** Null when the actor template is gone. */
  actorTemplate: Pick<SubstrateActorTemplate, "limits" | "workerSelector"> | null;
}

export interface SubstrateFleet {
  readAt: string;
  atespaces: SubstrateAtespace[];
  actors: ({ actor: SubstrateActor } & ActorTemplateFacts)[];
  workers: SubstrateWorker[];
  /**
   * WORKER_NAMESPACES and every worker namespace seen since start, by name: a WorkerPool stays listed after its last
   * worker is gone.
   */
  workerNamespaces: string[];
}

export type SubstrateRead = { ok: true; fleet: SubstrateFleet } | { ok: false; reason: FleetUnreachableReason };

/** The image and env of the first container that names an issue: the agent container. Null when none does. */
export function agentContainerOf(
  actorTemplate: SubstrateActorTemplate
): { image: string; env: Map<string, string> } | null {
  for (const { image, env: entries } of actorTemplate.containers) {
    const env = new Map(entries.map(({ name, value }) => [name, value]));
    if (env.get(AGENT_ENV.projectPath) && env.get(AGENT_ENV.projectId) && env.get(AGENT_ENV.issueIid)) {
      return { image, env };
    }
  }
  return null;
}

/** Null when the actor template does not name an issue. */
function agentOfActorTemplate(actorTemplate: SubstrateActorTemplate): ActorAgent | null {
  const container = agentContainerOf(actorTemplate);
  return container && agentOfEnv(container.env);
}

/** `env`: of a container that `agentContainerOf` returned. */
export function agentOfEnv(env: Map<string, string>): ActorAgent {
  return {
    issue: {
      projectPath: env.get(AGENT_ENV.projectPath)!,
      projectId: env.get(AGENT_ENV.projectId)!,
      iid: env.get(AGENT_ENV.issueIid)!,
      url: null,
    },
    codebase: null,
    agentProfile: env.get(AGENT_ENV.agentProfile) || null,
    model: env.get(AGENT_ENV.model) || null,
  };
}

export function asSourceError(error: unknown): AgentSubstrateSourceError {
  if (error instanceof AgentSubstrateSourceError) return error;
  return new AgentSubstrateSourceError("other", error instanceof Error ? error.message : String(error), {
    cause: error,
  });
}

/** Logs the error on the server; the client gets only the reason. `notFound` of a read that needs the object: `other`. */
export function unreachableReasonOf(error: unknown, read: "Fleet" | "Agent" | "Egress policy"): FleetUnreachableReason {
  const sourceError = asSourceError(error);
  const reason = sourceError.kind === "notFound" ? "other" : sourceError.kind;
  console.error(`[AgentSubstrate] ${read} read failed (${reason}):`, sourceError);
  return reason;
}

/**
 * Shared Substrate read of one source. The result, success or failure, is kept for SHARED_READ_TTL_MS from the end of
 * the read. Concurrent calls share one read.
 */
class SubstrateReader {
  private cached: { at: number; result: SubstrateRead } | null = null;
  private inflight: Promise<SubstrateRead> | null = null;
  /** By actor uid, no time limit. Entries of gone actors are dropped on each read. */
  private readonly actorTemplates = new Map<string, ActorTemplateFacts>();
  private readonly workerNamespaces = new Set<string>(WORKER_NAMESPACES);

  constructor(private readonly source: AgentSubstrateSource) {}

  read(): Promise<SubstrateRead> {
    const now = Date.now();
    if (this.cached && now - this.cached.at < SHARED_READ_TTL_MS) {
      return Promise.resolve(this.cached.result);
    }
    if (!this.inflight) {
      this.inflight = this.load(now)
        .then((result) => {
          this.cached = { at: Date.now(), result };
          return result;
        })
        .finally(() => {
          this.inflight = null;
        });
    }
    return this.inflight;
  }

  private async load(now: number): Promise<SubstrateRead> {
    try {
      const actorsWithActorTemplates = this.source.listActors().then(async (actors) => {
        const facts = await mapWithConcurrency(actors, ACTOR_TEMPLATE_READ_CONCURRENCY, (actor) =>
          this.actorTemplateOf(actor)
        );
        return actors.map((actor, index) => ({ actor, ...facts[index] }));
      });
      const [atespaces, actors, workers] = await Promise.all([
        this.source.listAtespaces(),
        actorsWithActorTemplates,
        this.source.listWorkers(),
      ]);

      const live = new Set(actors.map(({ actor }) => actor.uid));
      for (const uid of this.actorTemplates.keys()) {
        if (!live.has(uid)) this.actorTemplates.delete(uid);
      }

      for (const { workerNamespace } of workers) {
        if (workerNamespace) this.workerNamespaces.add(workerNamespace);
      }

      return {
        ok: true,
        fleet: {
          readAt: new Date(now).toISOString(),
          atespaces,
          actors,
          workers,
          workerNamespaces: [...this.workerNamespaces].sort(sortByName),
        },
      };
    } catch (error) {
      return { ok: false, reason: unreachableReasonOf(error, "Fleet") };
    }
  }

  /** A gone actor template (`notFound`) gives no agent and no actor template. An actor with no uid is not cached. */
  private async actorTemplateOf(actor: SubstrateActor): Promise<ActorTemplateFacts> {
    const cached = actor.uid ? this.actorTemplates.get(actor.uid) : undefined;
    if (cached !== undefined) return cached;

    let facts: ActorTemplateFacts;
    try {
      const actorTemplate = await this.source.getActorTemplate(actor.actorTemplate);
      facts = {
        agent: agentOfActorTemplate(actorTemplate),
        actorTemplate: { limits: { ...actorTemplate.limits }, workerSelector: { ...actorTemplate.workerSelector } },
      };
    } catch (error) {
      const sourceError = asSourceError(error);
      if (sourceError.kind !== "notFound") throw sourceError;
      facts = { agent: null, actorTemplate: null };
    }
    if (actor.uid) this.actorTemplates.set(actor.uid, facts);
    return facts;
  }
}

const readers = new WeakMap<AgentSubstrateSource, SubstrateReader>();

export function readSubstrate(source: AgentSubstrateSource): Promise<SubstrateRead> {
  let reader = readers.get(source);
  if (!reader) {
    reader = new SubstrateReader(source);
    readers.set(source, reader);
  }
  return reader.read();
}
