import { describe, expect, test } from "vitest";
import { getStatusIcon } from "./index";
import { approvalTaskAction } from "@my-project/shared";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import { CircleCheck, CircleSlash, CircleX, Clock, ShieldQuestion } from "lucide-react";
import type { ApprovalTask } from "@my-project/shared";

describe("getStatusIcon", () => {
  test("returns unknown icon for undefined action", () => {
    const approvalTask: ApprovalTask = {
      spec: {},
    } as unknown as ApprovalTask;

    const result = getStatusIcon(approvalTask);

    expect(result.component).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
  });

  test("returns in-progress icon for Pending action", () => {
    const approvalTask: ApprovalTask = {
      spec: { action: approvalTaskAction.Pending },
    } as unknown as ApprovalTask;

    const result = getStatusIcon(approvalTask);

    expect(result.component).toBe(Clock);
    expect(result.color).toBe(STATUS_COLOR.IN_PROGRESS);
  });

  test("returns success icon for Approved action", () => {
    const approvalTask: ApprovalTask = {
      spec: { action: approvalTaskAction.Approved },
    } as unknown as ApprovalTask;

    const result = getStatusIcon(approvalTask);

    expect(result.component).toBe(CircleCheck);
    expect(result.color).toBe(STATUS_COLOR.SUCCESS);
  });

  test("returns error icon for Rejected action", () => {
    const approvalTask: ApprovalTask = {
      spec: { action: approvalTaskAction.Rejected },
    } as unknown as ApprovalTask;

    const result = getStatusIcon(approvalTask);

    expect(result.component).toBe(CircleX);
    expect(result.color).toBe(STATUS_COLOR.ERROR);
  });

  test("returns suspended icon for Canceled action", () => {
    const approvalTask: ApprovalTask = {
      spec: { action: approvalTaskAction.Canceled },
    } as unknown as ApprovalTask;

    const result = getStatusIcon(approvalTask);

    expect(result.component).toBe(CircleSlash);
    expect(result.color).toBe(STATUS_COLOR.SUSPENDED);
    expect(result.isSpinning).toBe(true);
  });

  test("handles case-insensitive action", () => {
    const approvalTask: ApprovalTask = {
      spec: { action: "APPROVED" },
    } as unknown as ApprovalTask;

    const result = getStatusIcon(approvalTask);

    expect(result.component).toBe(CircleCheck);
    expect(result.color).toBe(STATUS_COLOR.SUCCESS);
  });

  test("returns unknown icon for unknown action", () => {
    const approvalTask: ApprovalTask = {
      spec: { action: "unknown-action" },
    } as unknown as ApprovalTask;

    const result = getStatusIcon(approvalTask);

    expect(result.component).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
  });
});
