import {
  AgentSubstrateSourceError,
  type AgentSubstrateSource,
  type SubstrateActor,
  type SubstrateActorTemplate,
  type SubstrateAtespace,
  type SubstrateEgressPolicy,
  type SubstrateObjectRef,
  type SubstrateWorker,
} from "./source.js";

export interface MemoryEgressPolicy extends SubstrateEgressPolicy {
  actor: SubstrateObjectRef;
}

export interface MemoryFleet {
  atespaces: SubstrateAtespace[];
  actors: SubstrateActor[];
  actorTemplates: SubstrateActorTemplate[];
  egressPolicies: MemoryEgressPolicy[];
  workers: SubstrateWorker[];
}

const EMPTY_FLEET: MemoryFleet = { atespaces: [], actors: [], actorTemplates: [], egressPolicies: [], workers: [] };

function mergeFleet(base: MemoryFleet, update: Partial<MemoryFleet>): MemoryFleet {
  return {
    atespaces: structuredClone(update.atespaces ?? base.atespaces),
    actors: structuredClone(update.actors ?? base.actors),
    actorTemplates: structuredClone(update.actorTemplates ?? base.actorTemplates),
    egressPolicies: structuredClone(update.egressPolicies ?? base.egressPolicies),
    workers: structuredClone(update.workers ?? base.workers),
  };
}

/** Returns copies, never the held objects. */
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

  async getActor(ref: SubstrateObjectRef): Promise<SubstrateActor> {
    return this.read(() => {
      const actor = this.fleet.actors.find(({ atespace, name }) => atespace === ref.atespace && name === ref.name);
      if (!actor) {
        throw new AgentSubstrateSourceError("notFound", `actor ${ref.atespace}/${ref.name} not found`);
      }
      return actor;
    });
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

  async getActorEgressPolicy(actor: SubstrateObjectRef): Promise<SubstrateEgressPolicy> {
    return this.read(() => {
      const policy = this.fleet.egressPolicies.find(
        (entry) => entry.actor.atespace === actor.atespace && entry.actor.name === actor.name
      );
      if (!policy) {
        throw new AgentSubstrateSourceError(
          "notFound",
          `egress policy of actor ${actor.atespace}/${actor.name} not found`
        );
      }
      return { rules: policy.rules };
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
