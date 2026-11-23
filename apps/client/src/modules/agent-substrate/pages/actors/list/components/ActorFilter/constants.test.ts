import { describe, expect, it } from "vitest";
import { HEALTHY_FLEET } from "../../../../../__fixtures__/storyFleet";
import { ACTOR_FILTER_NAMES } from "../../../../../constants/actorFilter";
import { actorMatchFunctions } from "./constants";

describe("actorMatchFunctions", () => {
  it("matches a numeric search value that the router parsed to a number", () => {
    const actor = structuredClone(HEALTHY_FLEET.actors.find(({ agent }) => agent !== null)!);
    actor.agent!.agentProfile = "17";
    const parsed = 17 as unknown as string;

    expect(actorMatchFunctions[ACTOR_FILTER_NAMES.AGENT_PROFILE]!(actor, parsed)).toBe(true);
    expect(actorMatchFunctions[ACTOR_FILTER_NAMES.AGENT_PROFILE]!(actor, 18 as unknown as string)).toBe(false);
  });
});
