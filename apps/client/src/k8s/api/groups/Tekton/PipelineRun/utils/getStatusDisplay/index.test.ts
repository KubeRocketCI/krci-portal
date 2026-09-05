import { describe, expect, test } from "vitest";
import { getStatusDisplay } from "./index";
import { getPipelineRunStatus, pipelineRunReason, tektonResultAnnotations } from "@my-project/shared";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import { CircleSlash, CircleX, LoaderCircle, ShieldQuestion } from "lucide-react";
import type { PipelineRun } from "@my-project/shared";

const makeRun = (status: string, reason?: string, opts?: { archived?: boolean }): PipelineRun =>
  ({
    metadata: {
      name: "x",
      namespace: "ns",
      labels: {},
      annotations: opts?.archived ? { [tektonResultAnnotations.historySource]: "true" } : {},
    },
    spec: {},
    status: { conditions: [{ type: "Succeeded", status, reason }] },
  }) as unknown as PipelineRun;

const makeRunWithNoConditions = (): PipelineRun =>
  ({
    metadata: { name: "x", namespace: "ns", labels: {}, annotations: {} },
    spec: {},
    status: {},
  }) as unknown as PipelineRun;

describe("getStatusDisplay", () => {
  test("live in-progress run with no reason: spinner icon and Running label", () => {
    const result = getStatusDisplay(getPipelineRunStatus(makeRunWithNoConditions()));

    expect(result.component).toBe(LoaderCircle);
    expect(result.color).toBe(STATUS_COLOR.IN_PROGRESS);
    expect(result.isSpinning).toBe(true);
    expect(result.label).toBe("Running");
  });

  test("Unknown status with PipelineRunPending reason: spinner icon and Pending label", () => {
    const result = getStatusDisplay(getPipelineRunStatus(makeRun("Unknown", pipelineRunReason.pipelinerunpending)));

    expect(result.component).toBe(LoaderCircle);
    expect(result.color).toBe(STATUS_COLOR.IN_PROGRESS);
    expect(result.isSpinning).toBe(true);
    expect(result.label).toBe("Pending");
  });

  test("live Unknown status with CancelledRunningFinally reason: cancelled icon, spinning, Cancelling label", () => {
    const result = getStatusDisplay(
      getPipelineRunStatus(makeRun("Unknown", pipelineRunReason.cancelledrunningfinally))
    );

    expect(result.component).toBe(CircleSlash);
    expect(result.color).toBe(STATUS_COLOR.CANCELLED);
    expect(result.isSpinning).toBe(true);
    expect(result.label).toBe("Cancelling");
  });

  test("archived Unknown status with no reason: question icon, not spinning, Unknown label", () => {
    const result = getStatusDisplay(getPipelineRunStatus(makeRun("Unknown", undefined, { archived: true })));

    expect(result.component).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
    expect(result.isSpinning).toBeFalsy();
    expect(result.label).toBe("Unknown");
  });

  test("False status with PipelineRunTimeout reason: error icon and Timeout label", () => {
    const result = getStatusDisplay(getPipelineRunStatus(makeRun("False", pipelineRunReason.pipelineruntimeout)));

    expect(result.component).toBe(CircleX);
    expect(result.color).toBe(STATUS_COLOR.ERROR);
    expect(result.label).toBe("Timeout");
  });
});
