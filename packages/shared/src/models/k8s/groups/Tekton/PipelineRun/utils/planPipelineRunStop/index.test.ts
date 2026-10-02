import { describe, expect, it } from "vitest";
import { tektonResultAnnotations } from "../../../../../../tektonResults/annotations.js";
import { pipelineRunReason } from "../../constants.js";
import type { PipelineRun } from "../../types.js";
import { isPipelineRunStoppable, planPipelineRunStop } from "./index.js";

interface RunState {
  conditionStatus?: string;
  reason?: string;
  specStatus?: string;
  annotations?: Record<string, string>;
}

const makeRun = ({ conditionStatus, reason, specStatus, annotations }: RunState = {}): PipelineRun =>
  ({
    metadata: { name: "run", namespace: "ns", annotations },
    spec: { status: specStatus },
    status: conditionStatus ? { conditions: [{ type: "Succeeded", status: conditionStatus, reason }] } : {},
  }) as unknown as PipelineRun;

const expectedPatch = {
  action: "patch",
  patch: {
    metadata: { annotations: { "app.edp.epam.com/queue-cancel-reason": "user-cancelled" } },
    spec: { status: "CancelledRunFinally" },
  },
};

describe("planPipelineRunStop", () => {
  it.each<[string, RunState]>([
    ["no condition yet", {}],
    ["running", { conditionStatus: "Unknown", reason: pipelineRunReason.running }],
    [
      "pending",
      { conditionStatus: "Unknown", reason: pipelineRunReason.pipelinerunpending, specStatus: "PipelineRunPending" },
    ],
  ])("patches a %s run to CancelledRunFinally with the user-cancelled reason", (_, state) => {
    expect(planPipelineRunStop(makeRun(state))).toEqual(expectedPatch);
  });

  it.each<[string, RunState]>([
    ["succeeded", { conditionStatus: "True", reason: pipelineRunReason.succeeded }],
    ["failed", { conditionStatus: "False", reason: pipelineRunReason.failed }],
    ["cancelled", { conditionStatus: "False", reason: pipelineRunReason.cancelled, specStatus: "Cancelled" }],
    ["history", { annotations: { [tektonResultAnnotations.historySource]: "true" } }],
  ])("skips a %s run as already_done", (_, state) => {
    expect(planPipelineRunStop(makeRun(state))).toEqual({ action: "skip", reason: "already_done" });
  });

  it.each<[string, RunState]>([
    ["cancelling", { conditionStatus: "Unknown", reason: pipelineRunReason.cancelledrunningfinally }],
    ["stopping", { conditionStatus: "Unknown", reason: pipelineRunReason.stoppedrunningfinally }],
    ["Cancelled spec", { conditionStatus: "Unknown", reason: pipelineRunReason.running, specStatus: "Cancelled" }],
    [
      "CancelledRunFinally spec",
      { conditionStatus: "Unknown", reason: pipelineRunReason.running, specStatus: "CancelledRunFinally" },
    ],
    [
      "StoppedRunFinally spec",
      { conditionStatus: "Unknown", reason: pipelineRunReason.running, specStatus: "StoppedRunFinally" },
    ],
  ])("skips a %s run as already_stopping", (_, state) => {
    expect(planPipelineRunStop(makeRun(state))).toEqual({ action: "skip", reason: "already_stopping" });
  });

  it("patches only the cancel-reason annotation, leaving others to the merge", () => {
    const plan = planPipelineRunStop(makeRun({ annotations: { "app.edp.epam.com/git-author": "someone" } }));

    expect(plan).toEqual(expectedPatch);
  });
});

describe("isPipelineRunStoppable", () => {
  it("is true for a live running run", () => {
    expect(isPipelineRunStoppable(makeRun({ conditionStatus: "Unknown", reason: pipelineRunReason.running }))).toBe(
      true
    );
  });

  it("is false for a finished run", () => {
    expect(isPipelineRunStoppable(makeRun({ conditionStatus: "True", reason: pipelineRunReason.succeeded }))).toBe(
      false
    );
  });

  it("is false for a run already stopping", () => {
    expect(isPipelineRunStoppable(makeRun({ specStatus: "CancelledRunFinally" }))).toBe(false);
  });
});
