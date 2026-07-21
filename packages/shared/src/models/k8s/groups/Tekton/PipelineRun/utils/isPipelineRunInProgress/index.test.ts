import { describe, expect, it } from "vitest";
import { isPipelineRunInProgress } from "./index.js";
import { pipelineRunReason, pipelineRunStatus } from "../../constants.js";
import type { PipelineRun } from "../../types.js";

const runWith = (status: string, reason?: string): PipelineRun =>
  ({
    metadata: { name: "x", namespace: "ns" },
    spec: {},
    status: { conditions: [{ type: "Succeeded", status, reason }] },
  }) as unknown as PipelineRun;

describe("isPipelineRunInProgress", () => {
  it("is true for live in-progress reasons (status Unknown + reason)", () => {
    expect(isPipelineRunInProgress(runWith(pipelineRunStatus.unknown, pipelineRunReason.started))).toBe(true);
    expect(isPipelineRunInProgress(runWith(pipelineRunStatus.unknown, pipelineRunReason.running))).toBe(true);
    expect(isPipelineRunInProgress(runWith(pipelineRunStatus.unknown, pipelineRunReason.pipelinerunpending))).toBe(
      true
    );
    expect(
      isPipelineRunInProgress(runWith(pipelineRunStatus.unknown, pipelineRunReason.pipelineruntimeoutrunningfinally))
    ).toBe(true);
    expect(isPipelineRunInProgress(runWith(pipelineRunStatus.unknown, pipelineRunReason.resolvingpipelineref))).toBe(
      true
    );
  });

  it("is false for terminal runs", () => {
    expect(isPipelineRunInProgress(runWith(pipelineRunStatus.true, pipelineRunReason.succeeded))).toBe(false);
    expect(isPipelineRunInProgress(runWith(pipelineRunStatus.false, pipelineRunReason.failed))).toBe(false);
  });

  it("is false for the cancelled/stopped family even while status is Unknown", () => {
    expect(isPipelineRunInProgress(runWith(pipelineRunStatus.unknown, pipelineRunReason.pipelinerunstopping))).toBe(
      false
    );
    expect(isPipelineRunInProgress(runWith(pipelineRunStatus.unknown, pipelineRunReason.cancelledrunningfinally))).toBe(
      false
    );
  });

  it("is false for a reasonless Unknown (loading, or an archived unfinalized record)", () => {
    expect(isPipelineRunInProgress(runWith(pipelineRunStatus.unknown, undefined))).toBe(false);
    expect(isPipelineRunInProgress(undefined)).toBe(false);
    expect(isPipelineRunInProgress({ status: {} } as unknown as PipelineRun)).toBe(false);
  });
});
