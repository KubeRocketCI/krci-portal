import { describe, expect, test } from "vitest";
import { getStepStatusIcon } from "./index";
import { taskRunStepStatusReason } from "@my-project/shared";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import { CircleCheck, CircleX, LoaderCircle, ShieldQuestion, SquareDashedIcon } from "lucide-react";
import type { TaskRunStepState } from "@my-project/shared";

describe("getStepStatusIcon", () => {
  test("returns unknown icon for undefined status", () => {
    const step: TaskRunStepState = {} as TaskRunStepState;

    const result = getStepStatusIcon(step);

    expect(result.component).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
  });

  test("returns in-progress icon for running status", () => {
    const step: TaskRunStepState = {
      running: { startedAt: "2024-01-01T00:00:00Z" },
    } as unknown as TaskRunStepState;

    const result = getStepStatusIcon(step);

    expect(result.component).toBe(LoaderCircle);
    expect(result.color).toBe(STATUS_COLOR.IN_PROGRESS);
    expect(result.isSpinning).toBe(true);
  });

  test("returns waiting icon for waiting status", () => {
    const step: TaskRunStepState = {
      waiting: { reason: "PodInitializing" },
    } as unknown as TaskRunStepState;

    const result = getStepStatusIcon(step);

    expect(result.component).toBe(SquareDashedIcon);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
  });

  test("returns success icon for terminated status with Completed reason", () => {
    const step: TaskRunStepState = {
      terminated: {
        exitCode: 0,
        reason: taskRunStepStatusReason.Completed,
        startedAt: "2024-01-01T00:00:00Z",
        finishedAt: "2024-01-01T00:01:00Z",
      },
    } as unknown as TaskRunStepState;

    const result = getStepStatusIcon(step);

    expect(result.component).toBe(CircleCheck);
    expect(result.color).toBe(STATUS_COLOR.SUCCESS);
  });

  test("returns error icon for terminated status with Error reason", () => {
    const step: TaskRunStepState = {
      terminated: {
        exitCode: 1,
        reason: "Error",
        startedAt: "2024-01-01T00:00:00Z",
        finishedAt: "2024-01-01T00:01:00Z",
      },
    } as unknown as TaskRunStepState;

    const result = getStepStatusIcon(step);

    expect(result.component).toBe(CircleX);
    expect(result.color).toBe(STATUS_COLOR.ERROR);
  });

  test("returns error icon for terminated status with other reasons", () => {
    const step: TaskRunStepState = {
      terminated: {
        exitCode: 143,
        reason: "ContainerCannotRun",
        startedAt: "2024-01-01T00:00:00Z",
        finishedAt: "2024-01-01T00:01:00Z",
      },
    } as unknown as TaskRunStepState;

    const result = getStepStatusIcon(step);

    expect(result.component).toBe(CircleX);
    expect(result.color).toBe(STATUS_COLOR.ERROR);
  });

  test("returns unknown icon for default case", () => {
    const step = {
      invalidStatus: { reason: "unknown" },
    } as unknown as TaskRunStepState;

    const result = getStepStatusIcon(step);

    expect(result.component).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
  });
});
