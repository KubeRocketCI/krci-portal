import { describe, expect, it } from "vitest";
import { summarizePipelineRunStop } from "./index.js";

describe("summarizePipelineRunStop", () => {
  it("counts outcomes per result", () => {
    expect(summarizePipelineRunStop([{ result: "stopping" }, { result: "failed" }, { result: "stopping" }])).toEqual({
      stopping: 2,
      skipped: 0,
      failed: 1,
    });
  });

  it("returns zero counts for no outcomes", () => {
    expect(summarizePipelineRunStop([])).toEqual({ stopping: 0, skipped: 0, failed: 0 });
  });
});
