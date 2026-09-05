import { describe, expect, test } from "vitest";
import { PipelineRun, tektonResultAnnotations } from "@my-project/shared";
import { CheckCircle2, CircleSlash, XCircle, PlayCircle, HelpCircle } from "lucide-react";
import { getStatusDisplay } from "./pipelineRunStatusDisplay";

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

  test("cancelled run (False, Cancelled)", () => {
    expect(getStatusDisplay(makeRun("False", "Cancelled"))).toEqual({
      label: "Cancelled",
      variant: "neutral",
      icon: CircleSlash,
    });
  });

  test("cancelling run (Unknown, CancelledRunningFinally)", () => {
    expect(getStatusDisplay(makeRun("Unknown", "CancelledRunningFinally"))).toEqual({
      label: "Cancelling",
      variant: "neutral",
      icon: CircleSlash,
    });
  });

  test("archived record with Unknown and no reason is unknown, not pending", () => {
    expect(getStatusDisplay(makeRun("Unknown", undefined, { archived: true }))).toEqual({
      label: "Unknown",
      variant: "neutral",
      icon: HelpCircle,
    });
  });
});
