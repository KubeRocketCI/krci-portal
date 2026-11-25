import { describe, expect, it } from "vitest";
import { HEALTHY_FLEET, PLAIN_ACTOR } from "../../../../../__fixtures__/storyFleet";
import { ACTOR_FILTER_NAMES } from "../../../../../constants/actorFilter";
import { actorFilterDefaultValues, actorMatchFunctions } from "./constants";

describe("actorMatchFunctions", () => {
  const agentActor = () => structuredClone(HEALTHY_FLEET.actors.find(({ agent }) => agent !== null)!);

  describe("atespace", () => {
    const matchAtespace = actorMatchFunctions[ACTOR_FILTER_NAMES.ATESPACE]!;

    it("matches the atespace by its exact name", () => {
      expect(matchAtespace(PLAIN_ACTOR, PLAIN_ACTOR.atespace)).toBe(true);
      expect(matchAtespace(agentActor(), PLAIN_ACTOR.atespace)).toBe(false);
    });
  });

  describe("worker pool", () => {
    const matchWorkerPool = actorMatchFunctions[ACTOR_FILTER_NAMES.WORKER_POOL]!;
    const placedActor = () => {
      const actor = agentActor();
      actor.placement = {
        worker: "worker-0",
        workerNamespace: "krci-agents",
        workerPool: "workers",
        workerPod: "workers-0",
        node: "node-a",
        sandboxRuntime: null,
      };
      return actor;
    };
    const suspendedActor = () => ({ ...agentActor(), placement: null });

    it("matches an actor placed on a worker of the worker pool, by namespace and name", () => {
      expect(matchWorkerPool(placedActor(), "krci-agents/workers")).toBe(true);
      expect(matchWorkerPool(placedActor(), "krci-agents/workers-small")).toBe(false);
      expect(matchWorkerPool(placedActor(), "other/workers")).toBe(false);
    });

    it("does not match an actor on no worker", () => {
      expect(matchWorkerPool(suspendedActor(), "krci-agents/workers")).toBe(false);
    });

    it("matches every actor with the empty or the all value", () => {
      expect(matchWorkerPool(suspendedActor(), "")).toBe(true);
      expect(matchWorkerPool(placedActor(), actorFilterDefaultValues.workerPool)).toBe(true);
    });
  });
});
