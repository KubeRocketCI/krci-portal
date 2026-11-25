import { describe, expect, it } from "vitest";
import { agentsSearchOfActorsUrl } from "./agentsSearchOfActorsUrl";

describe("agentsSearchOfActorsUrl", () => {
  it("moves the agent profile and Codebase filters to the Agents page, with the actor state", () => {
    expect(agentsSearchOfActorsUrl("?agentProfile=python&actorState=crashed&atespace=krci-agents")).toEqual({
      agentProfile: "python",
      actorState: "crashed",
    });
    expect(agentsSearchOfActorsUrl("?codebase=test-go-app&workerPool=krci-agents%2Fworkers")).toEqual({
      codebase: "test-go-app",
    });
  });

  it("keeps the URL text of a value that the router parses as JSON", () => {
    expect(agentsSearchOfActorsUrl("?agentProfile=007")).toEqual({ agentProfile: "007" });
    expect(agentsSearchOfActorsUrl("?agentProfile=__none__")).toEqual({ agentProfile: "__none__" });
  });

  it("leaves an Actors URL with no agent filter on the Actors page", () => {
    expect(agentsSearchOfActorsUrl("")).toBeNull();
    expect(agentsSearchOfActorsUrl("?actorState=crashed&atespace=krci-agents")).toBeNull();
  });
});
