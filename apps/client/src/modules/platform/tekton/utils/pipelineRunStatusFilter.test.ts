import { describe, expect, test } from "vitest";
import { pipelineRunPhase } from "@my-project/shared";
import {
  normalizePipelineRunStatusFilterValue,
  PipelineRunStatusFilterValue,
  resolvePipelineRunStatusFilter,
} from "./pipelineRunStatusFilter";

describe("resolvePipelineRunStatusFilter", () => {
  test("'all' has no live restriction, no history filter, and enables history", () => {
    const resolution = resolvePipelineRunStatusFilter("all");
    expect(resolution.livePhases).toBeUndefined();
    expect(resolution.historyFilter).toBeUndefined();
    expect(resolution.historyEnabled).toBe(true);
  });

  test("'in-progress' selects only the in-progress live phase, has no history filter, and disables history", () => {
    const resolution = resolvePipelineRunStatusFilter("in-progress");
    expect(resolution.livePhases).toEqual(new Set([pipelineRunPhase["in-progress"]]));
    expect(resolution.historyFilter).toBeUndefined();
    expect(resolution.historyEnabled).toBe(false);
  });

  test("'succeeded' selects the succeeded live phase, filters history to SUCCESS, and enables history", () => {
    const resolution = resolvePipelineRunStatusFilter("succeeded");
    expect(resolution.livePhases).toEqual(new Set([pipelineRunPhase.succeeded]));
    expect(resolution.historyFilter).toBe("summary.status == 1");
    expect(resolution.historyEnabled).toBe(true);
  });

  test("'failed' selects the failed live phase, filters history to FAILURE/TIMEOUT, and enables history", () => {
    const resolution = resolvePipelineRunStatusFilter("failed");
    expect(resolution.livePhases).toEqual(new Set([pipelineRunPhase.failed]));
    expect(resolution.historyFilter).toBe("(summary.status == 2 || summary.status == 3)");
    expect(resolution.historyEnabled).toBe(true);
  });

  test("'cancelled' selects the cancelled and cancelling live phases, filters history to CANCELLED, and enables history", () => {
    const resolution = resolvePipelineRunStatusFilter("cancelled");
    expect(resolution.livePhases).toEqual(new Set([pipelineRunPhase.cancelled, pipelineRunPhase.cancelling]));
    expect(resolution.historyFilter).toBe("summary.status == 4");
    expect(resolution.historyEnabled).toBe(true);
  });
});

describe("normalizePipelineRunStatusFilterValue", () => {
  test("undefined becomes 'all'", () => {
    expect(normalizePipelineRunStatusFilterValue(undefined)).toBe("all");
  });

  test("maps legacy 'true' to 'succeeded'", () => {
    expect(normalizePipelineRunStatusFilterValue("true")).toBe("succeeded");
  });

  test("maps legacy 'false' to 'failed'", () => {
    expect(normalizePipelineRunStatusFilterValue("false")).toBe("failed");
  });

  test("maps legacy 'unknown' to 'in-progress'", () => {
    expect(normalizePipelineRunStatusFilterValue("unknown")).toBe("in-progress");
  });

  test("passes through every current valid value unchanged", () => {
    const validValues: PipelineRunStatusFilterValue[] = ["all", "in-progress", "succeeded", "failed", "cancelled"];
    for (const value of validValues) {
      expect(normalizePipelineRunStatusFilterValue(value)).toBe(value);
    }
  });

  test("falls back to 'all' for junk values, including non-selectable phases", () => {
    expect(normalizePipelineRunStatusFilterValue("bogus")).toBe("all");
    expect(normalizePipelineRunStatusFilterValue("cancelling")).toBe("all");
    expect(normalizePipelineRunStatusFilterValue("")).toBe("all");
  });
});
