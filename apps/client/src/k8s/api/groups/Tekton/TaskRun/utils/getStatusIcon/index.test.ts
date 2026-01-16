import { describe, expect, test } from "vitest";
import { getStatusIcon } from "./index";
import { taskRunStatus, taskRunStatusReason } from "@my-project/shared";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import { CircleCheck, CircleX, LoaderCircle, ShieldQuestion } from "lucide-react";
import type { TaskRun } from "@my-project/shared";

describe("getStatusIcon", () => {
  test("returns unknown icon for undefined status", () => {
    const taskRun: TaskRun = {
      status: {},
    } as unknown as TaskRun;

    const result = getStatusIcon(taskRun);

    expect(result.component).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
  });

  test("returns success icon for true status", () => {
    const taskRun: TaskRun = {
      status: {
        conditions: [{ status: taskRunStatus.true, reason: "Succeeded" }],
      },
    } as unknown as TaskRun;

    const result = getStatusIcon(taskRun);

    expect(result.component).toBe(CircleCheck);
    expect(result.color).toBe(STATUS_COLOR.SUCCESS);
  });

  test("returns error icon for false status", () => {
    const taskRun: TaskRun = {
      status: {
        conditions: [{ status: taskRunStatus.false, reason: "Failed" }],
      },
    } as unknown as TaskRun;

    const result = getStatusIcon(taskRun);

    expect(result.component).toBe(CircleX);
    expect(result.color).toBe(STATUS_COLOR.ERROR);
  });

  test("returns in-progress icon for unknown status with started reason", () => {
    const taskRun: TaskRun = {
      status: {
        conditions: [{ status: taskRunStatus.unknown, reason: taskRunStatusReason.started }],
      },
    } as unknown as TaskRun;

    const result = getStatusIcon(taskRun);

    expect(result.component).toBe(LoaderCircle);
    expect(result.color).toBe(STATUS_COLOR.IN_PROGRESS);
    expect(result.isSpinning).toBe(true);
  });

  test("returns in-progress icon for unknown status with pending reason", () => {
    const taskRun: TaskRun = {
      status: {
        conditions: [{ status: taskRunStatus.unknown, reason: taskRunStatusReason.pending }],
      },
    } as unknown as TaskRun;

    const result = getStatusIcon(taskRun);

    expect(result.component).toBe(LoaderCircle);
    expect(result.color).toBe(STATUS_COLOR.IN_PROGRESS);
    expect(result.isSpinning).toBe(true);
  });

  test("returns in-progress icon for unknown status with running reason", () => {
    const taskRun: TaskRun = {
      status: {
        conditions: [{ status: taskRunStatus.unknown, reason: taskRunStatusReason.running }],
      },
    } as unknown as TaskRun;

    const result = getStatusIcon(taskRun);

    expect(result.component).toBe(LoaderCircle);
    expect(result.color).toBe(STATUS_COLOR.IN_PROGRESS);
    expect(result.isSpinning).toBe(true);
  });

  test("returns suspended icon for unknown status with TaskRunCancelled reason", () => {
    const taskRun: TaskRun = {
      status: {
        conditions: [{ status: taskRunStatus.unknown, reason: taskRunStatusReason.TaskRunCancelled }],
      },
    } as unknown as TaskRun;

    const result = getStatusIcon(taskRun);

    expect(result.component).toBe(CircleX);
    expect(result.color).toBe(STATUS_COLOR.SUSPENDED);
  });

  test("returns unknown icon for unknown status with unknown reason", () => {
    const taskRun: TaskRun = {
      status: {
        conditions: [{ status: taskRunStatus.unknown, reason: "unknown-reason" }],
      },
    } as unknown as TaskRun;

    const result = getStatusIcon(taskRun);

    expect(result.component).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
  });

  test("returns unknown icon for default case", () => {
    const taskRun: TaskRun = {
      status: {
        conditions: [{ status: "invalid-status", reason: "unknown" }],
      },
    } as unknown as TaskRun;

    const result = getStatusIcon(taskRun);

    expect(result.component).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
  });
});
