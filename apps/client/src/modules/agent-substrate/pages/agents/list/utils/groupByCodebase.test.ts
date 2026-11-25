import { describe, expect, it } from "vitest";
import type { ActorRow, ActorState } from "@my-project/shared";
import { RUNNING_ACTOR } from "../../../../__fixtures__/storyFleet";
import { groupAgentsByCodebase } from "./groupByCodebase";

function agent(
  name: string,
  state: ActorState,
  codebase: { name: string; namespace: string } | null,
  projectPath = "krci/other"
): ActorRow {
  const actor = structuredClone(RUNNING_ACTOR);
  actor.name = name;
  actor.state = state;
  actor.agent!.codebase = codebase;
  actor.agent!.issue.projectPath = projectPath;
  return actor;
}

const GO = { name: "go-app", namespace: "krci" };
const ALPHA = { name: "alpha", namespace: "krci" };

const summary = (agents: ActorRow[]) =>
  groupAgentsByCodebase(agents).map(({ codebase, projectPath, agents, running }) => ({
    codebase: codebase?.name ?? null,
    projectPath,
    agents: agents.map(({ name }) => name),
    running,
  }));

describe("groupAgentsByCodebase", () => {
  it("gives one group for each Codebase, sorted by name, with its agents in input order", () => {
    expect(
      summary([
        agent("a1", "running", GO, "krci/go-app"),
        agent("a2", "crashed", ALPHA, "krci/alpha"),
        agent("a3", "suspended", GO, "krci/go-app"),
      ])
    ).toEqual([
      { codebase: "alpha", projectPath: "krci/alpha", agents: ["a2"], running: 0 },
      { codebase: "go-app", projectPath: "krci/go-app", agents: ["a1", "a3"], running: 1 },
    ]);
  });

  it("counts the agents whose actor state is in the group running", () => {
    expect(
      summary([agent("a1", "running", GO), agent("a2", "resuming", GO), agent("a3", "running", GO)])[0].running
    ).toBe(2);
  });

  it("keeps Codebases of the same name in different namespaces apart", () => {
    const groups = groupAgentsByCodebase([
      agent("a1", "running", GO),
      agent("a2", "running", { name: "go-app", namespace: "team" }),
    ]);
    expect(groups.map(({ codebase }) => codebase?.namespace)).toEqual(["krci", "team"]);
  });

  it("groups agents with no Codebase by their project path, after the Codebases", () => {
    expect(
      summary([
        agent("a1", "running", null, "krci/zeta"),
        agent("a2", "running", GO),
        agent("a3", "crashed", null, "krci/beta"),
        agent("a4", "running", null, "krci/beta"),
      ])
    ).toEqual([
      { codebase: "go-app", projectPath: "krci/other", agents: ["a2"], running: 1 },
      { codebase: null, projectPath: "krci/beta", agents: ["a3", "a4"], running: 1 },
      { codebase: null, projectPath: "krci/zeta", agents: ["a1"], running: 1 },
    ]);
  });

  it("gives no group for an actor that hosts no agent, and none for no agents", () => {
    const plain = { ...agent("p1", "running", GO), agent: null };
    expect(groupAgentsByCodebase([plain])).toEqual([]);
    expect(groupAgentsByCodebase([])).toEqual([]);
  });
});
