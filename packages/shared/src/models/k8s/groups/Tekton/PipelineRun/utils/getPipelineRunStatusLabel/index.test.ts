import { describe, expect, it } from "vitest";
import { getPipelineRunStatusLabel } from "./index.js";
import { pipelineRunPhase, pipelineRunReason } from "../../constants.js";

describe("getPipelineRunStatusLabel", () => {
  it.each([
    // in-progress
    [{ phase: pipelineRunPhase["in-progress"], reason: undefined }, "Running"],
    [{ phase: pipelineRunPhase["in-progress"], reason: pipelineRunReason.started }, "Running"],
    [{ phase: pipelineRunPhase["in-progress"], reason: pipelineRunReason.running }, "Running"],
    [{ phase: pipelineRunPhase["in-progress"], reason: pipelineRunReason.pipelinerunpending }, "Pending"],
    [{ phase: pipelineRunPhase["in-progress"], reason: pipelineRunReason.pending }, "Pending"],
    [{ phase: pipelineRunPhase["in-progress"], reason: pipelineRunReason.resolvingpipelineref }, "Resolving"],
    [{ phase: pipelineRunPhase["in-progress"], reason: pipelineRunReason.resolvingtaskref }, "Resolving"],
    [
      { phase: pipelineRunPhase["in-progress"], reason: pipelineRunReason.pipelineruntimeoutrunningfinally },
      "Finalizing",
    ],
    [{ phase: pipelineRunPhase["in-progress"], reason: pipelineRunReason.pipelinerunstopping }, "Stopping"],
    [{ phase: pipelineRunPhase["in-progress"], reason: "somefutureunmappedreason" }, "Somefutureunmappedreason"],

    // cancelling / cancelled / unknown are constant regardless of reason
    [{ phase: pipelineRunPhase.cancelling, reason: undefined }, "Cancelling"],
    [{ phase: pipelineRunPhase.cancelling, reason: pipelineRunReason.cancelledrunningfinally }, "Cancelling"],
    [{ phase: pipelineRunPhase.cancelled, reason: undefined }, "Cancelled"],
    [{ phase: pipelineRunPhase.cancelled, reason: pipelineRunReason.cancelled }, "Cancelled"],
    [{ phase: pipelineRunPhase.unknown, reason: undefined }, "Unknown"],
    [{ phase: pipelineRunPhase.unknown, reason: "anything" }, "Unknown"],

    // succeeded
    [{ phase: pipelineRunPhase.succeeded, reason: undefined }, "Unknown"],
    [{ phase: pipelineRunPhase.succeeded, reason: pipelineRunReason.succeeded }, "Succeeded"],
    [{ phase: pipelineRunPhase.succeeded, reason: pipelineRunReason.completed }, "Completed"],

    // failed
    [{ phase: pipelineRunPhase.failed, reason: undefined }, "Unknown"],
    [{ phase: pipelineRunPhase.failed, reason: pipelineRunReason.failed }, "Failed"],
    [{ phase: pipelineRunPhase.failed, reason: pipelineRunReason.pipelineruntimeout }, "Timeout"],
    [{ phase: pipelineRunPhase.failed, reason: "somefutureunmappedreason" }, "Somefutureunmappedreason"],
  ])("%j -> %s", (status, expected) => {
    expect(getPipelineRunStatusLabel(status)).toBe(expected);
  });
});
