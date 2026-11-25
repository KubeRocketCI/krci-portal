import { describe, expect, it } from "vitest";
import type { SelectOption } from "@/core/components/form";
import {
  CRASHED_ACTOR,
  HEALTHY_FLEET,
  PLAIN_ACTOR,
  RUNNING_ACTOR,
  SEVERAL_AGENT_PROFILES_FLEET,
} from "../__fixtures__/storyFleet";
import {
  ALL_FILTER_VALUE,
  actorStateMatch,
  actorStateOptions,
  agentProfileMatch,
  agentProfileOptions,
  agentRows,
  codebaseMatch,
  codebaseOptions,
  withRawSearchValues,
} from "./fleetFilter";

const agentActor = () => structuredClone(HEALTHY_FLEET.actors.find(({ agent }) => agent !== null)!);

describe("withRawSearchValues", () => {
  const DEFAULTS = { agentProfile: ALL_FILTER_VALUE, codebase: ALL_FILTER_VALUE };

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
      ...DEFAULTS,
      agentProfile: parsed(raw) as string,
    }).agentProfile;

  it("gives back the URL text of a value that the router parsed to a number, boolean or null", () => {
    for (const raw of ["0", "17", "007", "1e3", "false", "true", "null"]) expect(restore(raw)).toBe(raw);
  });

  it("keeps a value that the router gave as a string, quoted or not", () => {
    expect(restore("go")).toBe("go");
    expect(
      withRawSearchValues(`?agentProfile=${encodeURIComponent('"17"')}`)({ ...DEFAULTS, agentProfile: "17" })
        .agentProfile
    ).toBe("17");
  });

  it("restores only the filters in the values, and leaves a filter not in the URL alone", () => {
    const values = { ...DEFAULTS, codebase: 7 as unknown as string };

    expect(withRawSearchValues("?codebase=7&workerPool=9")(values)).toEqual({ ...values, codebase: "7" });
  });
});

describe("agentProfileMatch", () => {
  it("matches the agent profile by its exact name", () => {
    const actor = agentActor();
    actor.agent!.agentProfile = "0";

    expect(agentProfileMatch(actor, "0")).toBe(true);
    expect(agentProfileMatch(actor, "00")).toBe(false);
  });

  it("matches an agent with no agent profile by the No agent profile value only", () => {
    const actor = agentActor();
    actor.agent!.agentProfile = null;
    const noProfile = agentProfileOptions([actor]).at(-1)!.value;

    expect(agentProfileMatch(actor, noProfile)).toBe(true);
    expect(agentProfileMatch(agentActor(), noProfile)).toBe(false);
  });

  it("does not match an actor that hosts no agent", () => {
    expect(agentProfileMatch(PLAIN_ACTOR, "go")).toBe(false);
  });

  it("matches every actor with the empty or the all value", () => {
    expect(agentProfileMatch(agentActor(), "")).toBe(true);
    expect(agentProfileMatch(PLAIN_ACTOR, ALL_FILTER_VALUE)).toBe(true);
  });
});

describe("codebaseMatch", () => {
  it("matches the name of the Codebase of the agent", () => {
    expect(codebaseMatch(RUNNING_ACTOR, "test-go-app")).toBe(true);
    expect(codebaseMatch(RUNNING_ACTOR, "test-python-app")).toBe(false);
  });

  it("does not match an agent with no matching Codebase or an actor with no agent", () => {
    const unmatched = structuredClone(RUNNING_ACTOR);
    unmatched.agent!.codebase = null;

    expect(codebaseMatch(unmatched, "test-go-app")).toBe(false);
    expect(codebaseMatch(PLAIN_ACTOR, "test-go-app")).toBe(false);
  });

  it("matches every actor with the empty or the all value", () => {
    expect(codebaseMatch(PLAIN_ACTOR, "")).toBe(true);
    expect(codebaseMatch(PLAIN_ACTOR, ALL_FILTER_VALUE)).toBe(true);
  });
});

describe("actorStateMatch", () => {
  it("matches the actor state group, not the actor state", () => {
    expect(actorStateMatch(CRASHED_ACTOR, "crashed")).toBe(true);
    expect(actorStateMatch(RUNNING_ACTOR, "crashed")).toBe(false);
    expect(actorStateMatch(PLAIN_ACTOR, "unknown")).toBe(true);
  });

  it("matches every actor with the empty or the all value", () => {
    expect(actorStateMatch(CRASHED_ACTOR, "")).toBe(true);
    expect(actorStateMatch(CRASHED_ACTOR, ALL_FILTER_VALUE)).toBe(true);
  });
});

describe("select options", () => {
  const values = (options: SelectOption[]) => options.map(({ value }) => value);
  const labels = (options: SelectOption[]) => options.map(({ label }) => label);

  it("lists each matched Codebase once, sorted, after All", () => {
    const twoGoAgents = [RUNNING_ACTOR, CRASHED_ACTOR, { ...structuredClone(RUNNING_ACTOR), name: "issue-2-99" }];

    expect(values(codebaseOptions([...twoGoAgents, PLAIN_ACTOR]))).toEqual([
      ALL_FILTER_VALUE,
      "test-go-app",
      "test-python-app",
    ]);
  });

  it("lists each agent profile once, sorted, after All, and No agent profile last when an agent has none", () => {
    expect(labels(agentProfileOptions(SEVERAL_AGENT_PROFILES_FLEET.actors))).toEqual([
      "All",
      "go",
      "java",
      "node",
      "python",
      "No agent profile",
    ]);
  });

  it("lists no No agent profile option when each agent has an agent profile", () => {
    expect(labels(agentProfileOptions(HEALTHY_FLEET.actors))).not.toContain("No agent profile");
  });

  it("lists the actor state groups after All", () => {
    expect(labels(actorStateOptions)).toEqual(["All", "Running", "Transitional", "Suspended", "Crashed", "Unknown"]);
  });
});

describe("agentRows", () => {
  it("keeps the actors that host an agent, in fleet order", () => {
    const rows = agentRows([RUNNING_ACTOR, PLAIN_ACTOR, CRASHED_ACTOR]);

    expect(rows.map(({ name }) => name)).toEqual([RUNNING_ACTOR.name, CRASHED_ACTOR.name]);
  });
});
