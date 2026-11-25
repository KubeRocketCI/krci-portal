import { describe, expect, it } from "vitest";
import type { ActorRow, ActorState } from "@my-project/shared";
import { PLAIN_ACTOR, RUNNING_ACTOR } from "../../../../__fixtures__/storyFleet";
import { AGENT_FILTER_NAMES, agentProfileFilterValue } from "../../../../constants/agentFilter";
import { ALL_FILTER_VALUE } from "../../../../utils/fleetFilter";
import { agentFilterDefaultValues } from "../components/AgentFilter/constants";
import { agentProfileChips } from "./agentProfileChips";

function agent(agentProfile: string | null, state: ActorState = "running", codebase = "go-app"): ActorRow {
  const actor = structuredClone(RUNNING_ACTOR);
  actor.agent!.agentProfile = agentProfile;
  actor.agent!.codebase = { name: codebase, namespace: "krci" };
  actor.state = state;
  return actor;
}

const chips = (agents: ActorRow[], values = agentFilterDefaultValues) => agentProfileChips(agents, values);

describe("agentProfileChips", () => {
  it("gives All with every agent, then each agent profile by name with its agent count", () => {
    expect(chips([agent("python"), agent("go"), agent("python"), PLAIN_ACTOR])).toEqual([
      { value: ALL_FILTER_VALUE, label: "All", count: 3 },
      { value: "go", label: "go", count: 1 },
      { value: "python", label: "python", count: 2 },
    ]);
  });

  it("gives the agents with no agent profile last", () => {
    expect(chips([agent(null), agent("go")])).toEqual([
      { value: ALL_FILTER_VALUE, label: "All", count: 2 },
      { value: "go", label: "go", count: 1 },
      { value: agentProfileFilterValue(null), label: "No agent profile", count: 1 },
    ]);
  });

  it("gives only All for no agents", () => {
    expect(chips([PLAIN_ACTOR])).toEqual([{ value: ALL_FILTER_VALUE, label: "All", count: 0 }]);
  });

  it("counts only the agents that the Codebase and actor state filters keep, and keeps every chip", () => {
    const agents = [
      agent("go", "running", "go-app"),
      agent("go", "crashed", "go-app"),
      agent("python", "running", "py-app"),
      agent("python", "running", "go-app"),
    ];
    const values = {
      ...agentFilterDefaultValues,
      [AGENT_FILTER_NAMES.CODEBASE]: "go-app",
      [AGENT_FILTER_NAMES.ACTOR_STATE]: "running",
    };
    expect(chips(agents, values)).toEqual([
      { value: ALL_FILTER_VALUE, label: "All", count: 2 },
      { value: "go", label: "go", count: 1 },
      { value: "python", label: "python", count: 1 },
    ]);
  });

  it("ignores the agent profile filter: each chip counts its own agents", () => {
    const values = { ...agentFilterDefaultValues, [AGENT_FILTER_NAMES.AGENT_PROFILE]: "go" };
    expect(chips([agent("go"), agent("python")], values)).toEqual([
      { value: ALL_FILTER_VALUE, label: "All", count: 2 },
      { value: "go", label: "go", count: 1 },
      { value: "python", label: "python", count: 1 },
    ]);
  });
});
