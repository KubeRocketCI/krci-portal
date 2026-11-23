import { describe, expect, it } from "vitest";
import { HEALTHY_FLEET } from "../../../../../__fixtures__/storyFleet";
import { ACTOR_FILTER_NAMES } from "../../../../../constants/actorFilter";
import { actorFilterDefaultValues, actorMatchFunctions, withRawSearchValues } from "./constants";
import type { ActorFilterValues } from "./types";

describe("withRawSearchValues", () => {
  /** As the router parses `?agentProfile=…`: JSON where it parses, the string otherwise. */
  const parsed = (raw: string): unknown => {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  };

  const restore = (raw: string) =>
    withRawSearchValues(`?agentProfile=${encodeURIComponent(raw)}`)({
      ...actorFilterDefaultValues,
      agentProfile: parsed(raw) as string,
    }).agentProfile;

  it("gives back the URL text of a value that the router parsed to a number, boolean or null", () => {
    for (const raw of ["0", "17", "007", "1e3", "false", "true", "null"]) expect(restore(raw)).toBe(raw);
  });

  it("keeps a value that the router gave as a string, quoted or not", () => {
    expect(restore("go")).toBe("go");
    expect(
      withRawSearchValues(`?agentProfile=${encodeURIComponent('"17"')}`)({
        ...actorFilterDefaultValues,
        agentProfile: "17",
      }).agentProfile
    ).toBe("17");
  });

  it("restores every filter of the Actors page and leaves a filter not in the URL alone", () => {
    const values: ActorFilterValues = { ...actorFilterDefaultValues, atespace: 7 as unknown as string };

    expect(withRawSearchValues("?atespace=7")(values)).toEqual({ ...values, atespace: "7" });
  });
});

describe("actorMatchFunctions", () => {
  const agentActor = () => structuredClone(HEALTHY_FLEET.actors.find(({ agent }) => agent !== null)!);
  const matchProfile = actorMatchFunctions[ACTOR_FILTER_NAMES.AGENT_PROFILE]!;

  it("matches the agent profile by its exact name", () => {
    const actor = agentActor();
    actor.agent!.agentProfile = "0";

    expect(matchProfile(actor, "0")).toBe(true);
    expect(matchProfile(actor, "00")).toBe(false);
  });

  it("matches every actor with the empty or the all value", () => {
    expect(matchProfile(agentActor(), "")).toBe(true);
    expect(matchProfile(agentActor(), actorFilterDefaultValues.agentProfile)).toBe(true);
  });
});
