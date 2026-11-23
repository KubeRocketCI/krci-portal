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

/** One read serves every signed-in user (ADR 0002). */
const SHARED_READ_TTL_MS = 5_000;
const TEMPLATE_READ_CONCURRENCY = 8;

/** The only actor template env values that leave the server (ADR 0001). */
export const AGENT_ENV = {
  projectPath: "PROJECT_PATH",
  projectId: "PROJECT_ID",
  issueIid: "ISSUE_IID",
  agentProfile: "AGENT_PROFILE",
  model: "ANTHROPIC_MODEL",
} as const;

interface TemplateFacts {
  /** Null on an actor that the dispatcher did not make. */
  agent: ActorAgent | null;
  /** Null when the template is gone. */
  limits: SubstrateActorTemplate["limits"] | null;
}

export interface SubstrateFleet {
  readAt: string;
  atespaces: SubstrateAtespace[];
  actors: ({ actor: SubstrateActor } & TemplateFacts)[];
  workers: SubstrateWorker[];
  /** Every worker namespace seen since start, by name: a WorkerPool stays listed after its last worker is gone. */
  workerNamespaces: string[];
}

export type SubstrateRead = { ok: true; fleet: SubstrateFleet } | { ok: false; reason: FleetUnreachableReason };

/** Null when the template does not name an issue. */
function agentOfTemplate(template: SubstrateActorTemplate): ActorAgent | null {
  for (const container of template.containers) {
    const env = new Map(container.env.map(({ name, value }) => [name, value]));
    const projectPath = env.get(AGENT_ENV.projectPath);
    const projectId = env.get(AGENT_ENV.projectId);
    const iid = env.get(AGENT_ENV.issueIid);
    if (projectPath && projectId && iid) {
      return {
        issue: { projectPath, projectId, iid, url: null },
        codebase: null,
        agentProfile: env.get(AGENT_ENV.agentProfile) || null,
        model: env.get(AGENT_ENV.model) || null,
      };
    }
  }
  return null;
}

function asSourceError(error: unknown): AgentSubstrateSourceError {
  if (error instanceof AgentSubstrateSourceError) return error;
  return new AgentSubstrateSourceError("other", error instanceof Error ? error.message : String(error), {
    cause: error,
  });
}

/**
 * Shared Substrate read of one source. The result, success or failure, is kept for SHARED_READ_TTL_MS from the end of
 * the read. Concurrent calls share one read.
 */
class SubstrateReader {
  private cached: { at: number; result: SubstrateRead } | null = null;
  private inflight: Promise<SubstrateRead> | null = null;
  /** By actor uid, no time limit. Entries of gone actors are dropped on each read. */
  private readonly templates = new Map<string, TemplateFacts>();
  private readonly workerNamespaces = new Set<string>();

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
      const actorsWithTemplates = this.source.listActors().then(async (actors) => {
        const facts = await mapWithConcurrency(actors, TEMPLATE_READ_CONCURRENCY, (actor) => this.templateOf(actor));
        return actors.map((actor, index) => ({ actor, ...facts[index] }));
      });
      const [atespaces, actors, workers] = await Promise.all([
        this.source.listAtespaces(),
        actorsWithTemplates,
        this.source.listWorkers(),
      ]);

      const live = new Set(actors.map(({ actor }) => actor.uid));
      for (const uid of this.templates.keys()) {
        if (!live.has(uid)) this.templates.delete(uid);
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
      const sourceError = asSourceError(error);
      const reason = sourceError.kind === "notFound" ? "other" : sourceError.kind;
      console.error(`[AgentSubstrate] Fleet read failed (${reason}):`, sourceError);
      return { ok: false, reason };
    }
  }

  /** A gone template (`notFound`) gives no agent and no limits. An actor with no uid is not cached. */
  private async templateOf(actor: SubstrateActor): Promise<TemplateFacts> {
    const cached = actor.uid ? this.templates.get(actor.uid) : undefined;
    if (cached !== undefined) return cached;

    let facts: TemplateFacts;
    try {
      const template = await this.source.getActorTemplate(actor.actorTemplate);
      facts = { agent: agentOfTemplate(template), limits: { ...template.limits } };
    } catch (error) {
      const sourceError = asSourceError(error);
      if (sourceError.kind !== "notFound") throw sourceError;
      facts = { agent: null, limits: null };
    }
    if (actor.uid) this.templates.set(actor.uid, facts);
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
