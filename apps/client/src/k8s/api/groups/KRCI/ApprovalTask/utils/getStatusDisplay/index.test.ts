import { describe, expect, test } from "vitest";
import { CircleCheck, CircleSlash, CircleX, Clock } from "lucide-react";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import { ApprovalTask } from "@my-project/shared";
import { getStatusDisplay } from "./index";

const approval = (action: string) => ({ spec: { action } }) as unknown as ApprovalTask;
const run = (status: string, reason: string) => ({
  status: { conditions: [{ type: "Succeeded", status, reason }] },
});

describe("getStatusDisplay", () => {
  test("no run yet: the approval action", () => {
    expect(getStatusDisplay(approval("Pending"), undefined)).toEqual({
      component: Clock,
      color: STATUS_COLOR.IN_PROGRESS,
      label: "Pending",
    });
  });

  test("run still in progress after the decision: the approval action", () => {
    expect(getStatusDisplay(approval("Approved"), run("Unknown", "Running"))).toMatchObject({
      component: CircleCheck,
      label: "Approved",
    });
  });

  test("finished run: its own reason carries the decision", () => {
    expect(getStatusDisplay(approval("Approved"), run("True", "Approved"))).toMatchObject({
      component: CircleCheck,
      color: STATUS_COLOR.SUCCESS,
      label: "Approved",
    });
    expect(getStatusDisplay(approval("Rejected"), run("False", "Rejected"))).toMatchObject({
      component: CircleX,
      color: STATUS_COLOR.ERROR,
      label: "Rejected",
    });
  });

  test("finished run overrides a stale approval: timeout and cancel win", () => {
    expect(getStatusDisplay(approval("Approved"), run("False", "CustomRunTimedOut"))).toMatchObject({
      component: CircleX,
      color: STATUS_COLOR.ERROR,
      label: "Timeout",
    });
    expect(getStatusDisplay(approval("Approved"), run("False", "CustomRunCancelled"))).toMatchObject({
      component: CircleSlash,
      color: STATUS_COLOR.CANCELLED,
      label: "Cancelled",
    });
  });

  test("an ApprovalTask with no spec renders Unknown rather than throwing", () => {
    expect(getStatusDisplay({} as ApprovalTask, undefined)).toMatchObject({ label: "Unknown" });
  });
});
