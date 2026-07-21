import { describe, expect, it } from "vitest";
import { getPipelineRunReasonLabel, isPipelineRunCancelledReason, pipelineRunReason } from "./constants.js";

describe("getPipelineRunReasonLabel", () => {
  it("maps compound in-progress reasons to readable labels", () => {
    expect(getPipelineRunReasonLabel(pipelineRunReason.pipelinerunpending)).toBe("Pending");
    expect(getPipelineRunReasonLabel(pipelineRunReason.resolvingpipelineref)).toBe("Resolving");
    expect(getPipelineRunReasonLabel(pipelineRunReason.pipelineruntimeoutrunningfinally)).toBe("Finalizing");
    expect(getPipelineRunReasonLabel(pipelineRunReason.pipelineruntimeout)).toBe("Timeout");
  });

  it("collapses every cancel/stop reason to 'Cancelled'", () => {
    expect(getPipelineRunReasonLabel(pipelineRunReason.cancelled)).toBe("Cancelled");
    expect(getPipelineRunReasonLabel(pipelineRunReason.cancelledrunningfinally)).toBe("Cancelled");
    expect(getPipelineRunReasonLabel(pipelineRunReason.stoppedrunningfinally)).toBe("Cancelled");
    expect(getPipelineRunReasonLabel(pipelineRunReason.pipelinerunstopping)).toBe("Cancelled");
  });

  it("falls back to the raw reason for already-readable reasons", () => {
    expect(getPipelineRunReasonLabel(pipelineRunReason.running)).toBe("running");
    expect(getPipelineRunReasonLabel(pipelineRunReason.failed)).toBe("failed");
  });

  it("returns 'Unknown' for an undefined reason", () => {
    expect(getPipelineRunReasonLabel(undefined)).toBe("Unknown");
  });
});

describe("isPipelineRunCancelledReason", () => {
  it("recognizes the cancel/stop family and nothing else", () => {
    expect(isPipelineRunCancelledReason(pipelineRunReason.cancelled)).toBe(true);
    expect(isPipelineRunCancelledReason(pipelineRunReason.pipelinerunstopping)).toBe(true);
    expect(isPipelineRunCancelledReason(pipelineRunReason.running)).toBe(false);
    expect(isPipelineRunCancelledReason(undefined)).toBe(false);
  });
});
