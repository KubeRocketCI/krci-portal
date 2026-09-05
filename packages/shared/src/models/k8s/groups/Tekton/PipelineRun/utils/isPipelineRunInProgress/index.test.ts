import { describe, expect, test } from "vitest";
import { isPipelineRunInProgress } from "./index.js";
import { pipelineRunReason } from "../../constants.js";
import type { PipelineRun } from "../../types.js";

const makeRun = (status: string, reason?: string): PipelineRun =>
  ({
    metadata: { name: "x", namespace: "ns", labels: {}, annotations: {} },
    spec: {},
    status: { conditions: [{ type: "Succeeded", status, reason }] },
  }) as unknown as PipelineRun;

describe("isPipelineRunInProgress", () => {
  test("true for a live Unknown+Started run", () => {
    expect(isPipelineRunInProgress(makeRun("Unknown", pipelineRunReason.started))).toBe(true);
  });

  test("false for a True run", () => {
    expect(isPipelineRunInProgress(makeRun("True", pipelineRunReason.succeeded))).toBe(false);
  });

  test("false for a live Unknown+CancelledRunningFinally run", () => {
    expect(isPipelineRunInProgress(makeRun("Unknown", pipelineRunReason.cancelledrunningfinally))).toBe(false);
  });

  test("false for undefined", () => {
    expect(isPipelineRunInProgress(undefined)).toBe(false);
  });
});
