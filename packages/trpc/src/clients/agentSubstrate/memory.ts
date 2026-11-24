import {
  AgentSubstrateSourceError,
  type AgentSubstrateSource,
  type SubstrateActor,
  type SubstrateActorTemplate,
  type SubstrateAtespace,
  type SubstrateObjectRef,
  type SubstrateWorker,
} from "./source.js";

export interface MemoryFleet {
  atespaces: SubstrateAtespace[];
  actors: SubstrateActor[];
  actorTemplates: SubstrateActorTemplate[];
  workers: SubstrateWorker[];
}

const EMPTY_FLEET: MemoryFleet = { atespaces: [], actors: [], actorTemplates: [], workers: [] };

function mergeFleet(base: MemoryFleet, update: Partial<MemoryFleet>): MemoryFleet {
  return {
    atespaces: structuredClone(update.atespaces ?? base.atespaces),
    actors: structuredClone(update.actors ?? base.actors),
    actorTemplates: structuredClone(update.actorTemplates ?? base.actorTemplates),
    workers: structuredClone(update.workers ?? base.workers),
  };
}

/** Test adapter. Returns copies, never the held objects. */
export class MemoryAgentSubstrateSource implements AgentSubstrateSource {
  private fleet: MemoryFleet;
  private error: AgentSubstrateSourceError | null = null;

  constructor(fleet: Partial<MemoryFleet> = {}) {
    this.fleet = mergeFleet(EMPTY_FLEET, fleet);
  }

  setFleet(fleet: Partial<MemoryFleet>): void {
    this.fleet = mergeFleet(this.fleet, fleet);
  }

  /** Every read rejects with `error` until it is cleared with `null`. */
  failWith(error: AgentSubstrateSourceError | null): void {
    this.error = error;
  }

  async listAtespaces(): Promise<SubstrateAtespace[]> {
    return this.read(() => this.fleet.atespaces);
  }

  async listActors(): Promise<SubstrateActor[]> {
    return this.read(() => this.fleet.actors);
  }

  async getActorTemplate(ref: SubstrateObjectRef): Promise<SubstrateActorTemplate> {
    return this.read(() => {
      const actorTemplate = this.fleet.actorTemplates.find(
        ({ atespace, name }) => atespace === ref.atespace && name === ref.name
      );
      if (!actorTemplate) {
        throw new AgentSubstrateSourceError("notFound", `actor template ${ref.atespace}/${ref.name} not found`);
      }
      return actorTemplate;
    });
  }

  async listWorkers(): Promise<SubstrateWorker[]> {
    return this.read(() => this.fleet.workers);
  }

  private read<T>(select: () => T): T {
    if (this.error) {
      throw this.error;
    }
    return structuredClone(select());
  }
}
