import { describe, expect, it } from "vitest";
import {
  getPipelineRunReasonLabel,
  isPipelineRunCancelledReason,
  isPipelineRunCancellingReason,
  isPipelineRunPendingReason,
  pipelineRunReason,
} from "./constants.js";

describe("getPipelineRunReasonLabel", () => {
  it("maps compound in-progress reasons to readable labels", () => {
    expect(getPipelineRunReasonLabel(pipelineRunReason.pipelinerunpending)).toBe("Pending");
    expect(getPipelineRunReasonLabel(pipelineRunReason.pending)).toBe("Pending");
    expect(getPipelineRunReasonLabel(pipelineRunReason.resolvingpipelineref)).toBe("Resolving");
    expect(getPipelineRunReasonLabel(pipelineRunReason.resolvingtaskref)).toBe("Resolving");
    expect(getPipelineRunReasonLabel(pipelineRunReason.pipelineruntimeoutrunningfinally)).toBe("Finalizing");
    expect(getPipelineRunReasonLabel(pipelineRunReason.pipelineruntimeout)).toBe("Timeout");
    expect(getPipelineRunReasonLabel(pipelineRunReason.pipelinerunstopping)).toBe("Stopping");
  });

  it("collapses the cancelled family to 'Cancelled'", () => {
    expect(getPipelineRunReasonLabel(pipelineRunReason.cancelled)).toBe("Cancelled");
    expect(getPipelineRunReasonLabel(pipelineRunReason.pipelineruncancelled)).toBe("Cancelled");
  });

  it("collapses the cancelling family to 'Cancelling'", () => {
    expect(getPipelineRunReasonLabel(pipelineRunReason.cancelledrunningfinally)).toBe("Cancelling");
    expect(getPipelineRunReasonLabel(pipelineRunReason.stoppedrunningfinally)).toBe("Cancelling");
  });

  it("falls back to the raw reason for already-readable or unknown reasons", () => {
    expect(getPipelineRunReasonLabel(pipelineRunReason.running)).toBe("running");
    expect(getPipelineRunReasonLabel(pipelineRunReason.failed)).toBe("failed");
    expect(getPipelineRunReasonLabel("somethingnew")).toBe("somethingnew");
  });

  it("returns 'Unknown' for an undefined reason", () => {
    expect(getPipelineRunReasonLabel(undefined)).toBe("Unknown");
  });
});

describe("isPipelineRunCancelledReason", () => {
  it("recognizes only the cancelled family", () => {
    expect(isPipelineRunCancelledReason(pipelineRunReason.cancelled)).toBe(true);
    expect(isPipelineRunCancelledReason(pipelineRunReason.pipelineruncancelled)).toBe(true);
    expect(isPipelineRunCancelledReason(pipelineRunReason.pipelinerunstopping)).toBe(false);
    expect(isPipelineRunCancelledReason(pipelineRunReason.cancelledrunningfinally)).toBe(false);
    expect(isPipelineRunCancelledReason(pipelineRunReason.stoppedrunningfinally)).toBe(false);
    expect(isPipelineRunCancelledReason(pipelineRunReason.running)).toBe(false);
    expect(isPipelineRunCancelledReason(undefined)).toBe(false);
  });
});

describe("isPipelineRunCancellingReason", () => {
  it("recognizes only the cancelling family", () => {
    expect(isPipelineRunCancellingReason(pipelineRunReason.cancelledrunningfinally)).toBe(true);
    expect(isPipelineRunCancellingReason(pipelineRunReason.stoppedrunningfinally)).toBe(true);
    expect(isPipelineRunCancellingReason(pipelineRunReason.cancelled)).toBe(false);
    expect(isPipelineRunCancellingReason(pipelineRunReason.pipelineruncancelled)).toBe(false);
    expect(isPipelineRunCancellingReason(pipelineRunReason.pipelinerunstopping)).toBe(false);
    expect(isPipelineRunCancellingReason(undefined)).toBe(false);
  });
});

describe("isPipelineRunPendingReason", () => {
  it("recognizes only the pending family", () => {
    expect(isPipelineRunPendingReason(pipelineRunReason.pipelinerunpending)).toBe(true);
    expect(isPipelineRunPendingReason(pipelineRunReason.pending)).toBe(true);
    expect(isPipelineRunPendingReason(pipelineRunReason.running)).toBe(false);
    expect(isPipelineRunPendingReason(pipelineRunReason.pipelinerunstopping)).toBe(false);
    expect(isPipelineRunPendingReason(undefined)).toBe(false);
  });
});
