import { describe, expect, test } from "vitest";
import { isPipelineRunBlocking } from "./index.js";
import type { PipelineRun } from "../../types.js";

const makeRun = (status: string, reason?: string): PipelineRun =>
  ({
    metadata: { name: "x", namespace: "ns", labels: {}, annotations: {} },
    spec: {},
    status: { conditions: [{ type: "Succeeded", status, reason }] },
  }) as unknown as PipelineRun;

describe("isPipelineRunBlocking", () => {
  test("true for in-progress", () => {
    expect(isPipelineRunBlocking(makeRun("Unknown", "Running"))).toBe(true);
  });

  test("true for cancelling", () => {
    expect(isPipelineRunBlocking(makeRun("Unknown", "CancelledRunningFinally"))).toBe(true);
  });

  test("false for succeeded", () => {
    expect(isPipelineRunBlocking(makeRun("True", "Succeeded"))).toBe(false);
  });
});
