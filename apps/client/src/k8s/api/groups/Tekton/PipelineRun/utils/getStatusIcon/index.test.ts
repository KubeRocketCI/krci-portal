import { describe, expect, test } from "vitest";
import { getStatusIcon } from "./index";
import { pipelineRunStatus, pipelineRunReason } from "@my-project/shared";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import { CircleCheck, CircleX, LoaderCircle, ShieldQuestion } from "lucide-react";
import type { PipelineRun } from "@my-project/shared";

describe("getStatusIcon", () => {
  test("returns unknown icon for undefined pipelineRun", () => {
    const result = getStatusIcon(undefined);

    expect(result.component).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
  });

  test("returns unknown icon for undefined status or reason", () => {
    const pipelineRun: PipelineRun = {
      status: {},
    } as unknown as PipelineRun;

    const result = getStatusIcon(pipelineRun);

    expect(result.component).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
  });

  test("returns success icon for true status", () => {
    const pipelineRun: PipelineRun = {
      status: {
        conditions: [{ status: pipelineRunStatus.true, reason: "Succeeded" }],
      },
    } as unknown as PipelineRun;

    const result = getStatusIcon(pipelineRun);

    expect(result.component).toBe(CircleCheck);
    expect(result.color).toBe(STATUS_COLOR.SUCCESS);
  });

  test("returns error icon for false status", () => {
    const pipelineRun: PipelineRun = {
      status: {
        conditions: [{ status: pipelineRunStatus.false, reason: "Failed" }],
      },
    } as unknown as PipelineRun;

    const result = getStatusIcon(pipelineRun);

    expect(result.component).toBe(CircleX);
    expect(result.color).toBe(STATUS_COLOR.ERROR);
  });

  test("returns in-progress icon for unknown status with started reason", () => {
    const pipelineRun: PipelineRun = {
      status: {
        conditions: [{ status: pipelineRunStatus.unknown, reason: pipelineRunReason.started }],
      },
    } as unknown as PipelineRun;

    const result = getStatusIcon(pipelineRun);

    expect(result.component).toBe(LoaderCircle);
    expect(result.color).toBe(STATUS_COLOR.IN_PROGRESS);
    expect(result.isSpinning).toBe(true);
  });

  test("returns in-progress icon for unknown status with running reason", () => {
    const pipelineRun: PipelineRun = {
      status: {
        conditions: [{ status: pipelineRunStatus.unknown, reason: pipelineRunReason.running }],
      },
    } as unknown as PipelineRun;

    const result = getStatusIcon(pipelineRun);

    expect(result.component).toBe(LoaderCircle);
    expect(result.color).toBe(STATUS_COLOR.IN_PROGRESS);
    expect(result.isSpinning).toBe(true);
  });

  test("returns suspended icon for unknown status with cancelled reason", () => {
    const pipelineRun: PipelineRun = {
      status: {
        conditions: [{ status: pipelineRunStatus.unknown, reason: pipelineRunReason.cancelled }],
      },
    } as unknown as PipelineRun;

    const result = getStatusIcon(pipelineRun);

    expect(result.component).toBe(CircleX);
    expect(result.color).toBe(STATUS_COLOR.SUSPENDED);
  });

  test("returns unknown icon for unknown status with unknown reason", () => {
    const pipelineRun: PipelineRun = {
      status: {
        conditions: [{ status: pipelineRunStatus.unknown, reason: "unknown-reason" }],
      },
    } as unknown as PipelineRun;

    const result = getStatusIcon(pipelineRun);

    expect(result.component).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
  });
});
