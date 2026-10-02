import { describe, expect, it } from "vitest";
import type { PipelineRun } from "../../types.js";
import { getPipelineRunRefKey, toPipelineRunRef } from "./index.js";

describe("toPipelineRunRef", () => {
  it("takes namespace and name from metadata", () => {
    const run = { metadata: { name: "run-a", namespace: "team-a" } } as unknown as PipelineRun;

    expect(toPipelineRunRef(run)).toEqual({ namespace: "team-a", name: "run-a" });
  });
});

describe("getPipelineRunRefKey", () => {
  it("keys a run by namespace and name", () => {
    expect(getPipelineRunRefKey({ namespace: "team-a", name: "run-a" })).toBe("team-a/run-a");
  });
});
