import { describe, expect, test } from "vitest";
import { Circle, CircleCheck, Clock } from "lucide-react";
import { ApprovalTask } from "@my-project/shared";
import { getPipelineTaskStatusDisplay } from "./getPipelineTaskStatusDisplay";

const approval = (action: string) => ({ spec: { action } }) as unknown as ApprovalTask;
const run = (status: string, reason: string) => ({
  status: { conditions: [{ type: "Succeeded", status, reason }] },
});

describe("getPipelineTaskStatusDisplay", () => {
  test("no approval task: the run decides, and no run reads Not Started", () => {
    expect(getPipelineTaskStatusDisplay({})).toMatchObject({
      component: Circle,
      label: "Not Started",
    });
    expect(getPipelineTaskStatusDisplay({ run: run("True", "Succeeded") })).toMatchObject({
      component: CircleCheck,
      label: "Succeeded",
    });
  });

  test("approval task present: the approval rule decides", () => {
    expect(getPipelineTaskStatusDisplay({ approvalTask: approval("Pending") })).toMatchObject({
      component: Clock,
      label: "Pending",
    });
    expect(
      getPipelineTaskStatusDisplay({ approvalTask: approval("Approved"), run: run("True", "Approved") })
    ).toMatchObject({
      component: CircleCheck,
      label: "Approved",
    });
  });
});
