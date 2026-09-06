import { describe, expect, test } from "vitest";
import { Circle } from "lucide-react";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import { getStatusDisplay } from "./index";

const run = (status: string, reason: string) => ({
  status: { conditions: [{ type: "Succeeded", status, reason }] },
});

describe("getStatusDisplay", () => {
  test("no run object reads Not Started", () => {
    expect(getStatusDisplay(undefined)).toEqual({
      component: Circle,
      color: STATUS_COLOR.UNKNOWN,
      label: "Not Started",
    });
  });

  test("a run with no condition is running, not Not Started", () => {
    expect(getStatusDisplay({}).label).toBe("Running");
  });

  test("icon and label come from the same classification", () => {
    const display = getStatusDisplay(run("False", "TaskRunCancelled"));

    expect(display.label).toBe("Cancelled");
    expect(display.color).toBe(STATUS_COLOR.CANCELLED);
  });

  test("a CustomRun cancel reason reads Cancelled too", () => {
    expect(getStatusDisplay(run("False", "CustomRunCancelled")).label).toBe("Cancelled");
  });
});
