import { describe, expect, it } from "vitest";
import { modeFromPath } from "./mode";

describe("modeFromPath", () => {
  it.each([
    ["/c/dev/agent/overview", "agent"],
    ["/c/dev/agent", "agent"],
    ["/c/dev/k8s/pods", "k8s"],
    ["/c/dev/projects", "krci"],
    ["/c/dev/projects/agent-tools", "krci"],
    ["/c/dev/projects/k8s-tools", "krci"],
    ["/c/dev/agents/overview", "krci"],
    ["/c/other/agent/overview", "krci"],
  ] as const)("reads %s as %s for cluster dev", (pathname, expected) => {
    expect(modeFromPath(pathname, "dev")).toBe(expected);
  });

  it("reads krci when no cluster is known", () => {
    expect(modeFromPath("/c/dev/agent/overview", undefined)).toBe("krci");
  });
});
