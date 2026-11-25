import { describe, expect, it } from "vitest";
import { modeFromPath } from "./mode";

describe("modeFromPath", () => {
  it.each([
    ["/c/dev/factory/overview", "factory"],
    ["/c/dev/factory", "factory"],
    ["/c/dev/k8s/pods", "k8s"],
    ["/c/dev/projects", "krci"],
    ["/c/dev/projects/factory-tools", "krci"],
    ["/c/dev/projects/k8s-tools", "krci"],
    ["/c/dev/agent/overview", "krci"],
    ["/c/dev/factories/overview", "krci"],
    ["/c/other/factory/overview", "krci"],
  ] as const)("reads %s as %s for cluster dev", (pathname, expected) => {
    expect(modeFromPath(pathname, "dev")).toBe(expected);
  });

  it("reads krci when no cluster is known", () => {
    expect(modeFromPath("/c/dev/factory/overview", undefined)).toBe("krci");
  });
});
