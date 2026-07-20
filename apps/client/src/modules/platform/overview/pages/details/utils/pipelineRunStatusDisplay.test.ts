import { describe, expect, test } from "vitest";
import { PipelineRun } from "@my-project/shared";
import { CheckCircle2, CircleSlash, XCircle, PlayCircle, Clock } from "lucide-react";
import { getStatusDisplay } from "./pipelineRunStatusDisplay";

const makeRun = (status: string, reason?: string): PipelineRun =>
  ({
    metadata: { name: "x", namespace: "ns", labels: {}, annotations: {} },
    spec: {},
    status: { conditions: [{ status, reason }] },
  }) as unknown as PipelineRun;

describe("getStatusDisplay", () => {
  test("succeeded run", () => {
    expect(getStatusDisplay(makeRun("True", "Succeeded"))).toEqual({
      label: "Succeeded",
      variant: "success",
      icon: CheckCircle2,
    });
  });

  test("failed run", () => {
    expect(getStatusDisplay(makeRun("False", "Failed"))).toEqual({
      label: "Failed",
      variant: "error",
      icon: XCircle,
    });
  });

  test("running run", () => {
    expect(getStatusDisplay(makeRun("Unknown", "Running"))).toEqual({
      label: "Running",
      variant: "info",
      icon: PlayCircle,
    });
  });

  test.each(["Cancelled", "CancelledRunningFinally", "StoppedRunningFinally"])(
    "cancelled run (%s, status False) is neutral, not a failure",
    (reason) => {
      expect(getStatusDisplay(makeRun("False", reason))).toEqual({
        label: "Cancelled",
        variant: "neutral",
        icon: CircleSlash,
      });
    }
  );

  test("stopping run (Unknown + PipelineRunStopping) is treated as cancelled", () => {
    expect(getStatusDisplay(makeRun("Unknown", "PipelineRunStopping"))).toEqual({
      label: "Cancelled",
      variant: "neutral",
      icon: CircleSlash,
    });
  });

  test("unknown reason falls back to pending", () => {
    expect(getStatusDisplay(makeRun("Unknown", "SomethingElse"))).toEqual({
      label: "Pending",
      variant: "neutral",
      icon: Clock,
    });
  });
});
