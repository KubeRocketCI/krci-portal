import { describe, expect, test } from "vitest";
import { getTektonResultStatusIcon, getPipelineRunConditionStatusIcon } from "./statusIcons";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import { CircleCheck, CircleX, Clock, Loader2, ShieldQuestion } from "lucide-react";
import type { TektonResultStatus, DecodedPipelineRunCondition } from "@my-project/shared";

describe("getTektonResultStatusIcon", () => {
  test("returns success icon for SUCCESS status", () => {
    const result = getTektonResultStatusIcon("SUCCESS" as TektonResultStatus);

    expect(result.Icon).toBe(CircleCheck);
    expect(result.color).toBe(STATUS_COLOR.SUCCESS);
    expect(result.title).toBe("Success");
    expect(result.isSpinning).toBe(false);
  });

  test("returns error icon for FAILURE status", () => {
    const result = getTektonResultStatusIcon("FAILURE" as TektonResultStatus);

    expect(result.Icon).toBe(CircleX);
    expect(result.color).toBe(STATUS_COLOR.ERROR);
    expect(result.title).toBe("Failure");
    expect(result.isSpinning).toBe(false);
  });

  test("returns clock icon for TIMEOUT status", () => {
    const result = getTektonResultStatusIcon("TIMEOUT" as TektonResultStatus);

    expect(result.Icon).toBe(Clock);
    expect(result.color).toBe(STATUS_COLOR.MISSING);
    expect(result.title).toBe("Timeout");
    expect(result.isSpinning).toBe(false);
  });

  test("returns suspended icon for CANCELLED status", () => {
    const result = getTektonResultStatusIcon("CANCELLED" as TektonResultStatus);

    expect(result.Icon).toBe(CircleX);
    expect(result.color).toBe(STATUS_COLOR.SUSPENDED);
    expect(result.title).toBe("Cancelled");
    expect(result.isSpinning).toBe(false);
  });

  test("returns unknown icon for UNKNOWN status", () => {
    const result = getTektonResultStatusIcon("UNKNOWN" as TektonResultStatus);

    expect(result.Icon).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
    expect(result.title).toBe("Unknown");
    expect(result.isSpinning).toBe(false);
  });

  test("returns unknown icon for undefined status", () => {
    const result = getTektonResultStatusIcon(undefined);

    expect(result.Icon).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
    expect(result.title).toBe("Unknown");
    expect(result.isSpinning).toBe(false);
  });
});

describe("getPipelineRunConditionStatusIcon", () => {
  test("returns unknown icon for undefined condition", () => {
    const result = getPipelineRunConditionStatusIcon(undefined);

    expect(result.Icon).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
    expect(result.title).toBe("Unknown");
    expect(result.isSpinning).toBe(false);
  });

  test("returns success icon for True status", () => {
    const condition: DecodedPipelineRunCondition = {
      status: "True",
      reason: "Succeeded",
    } as DecodedPipelineRunCondition;

    const result = getPipelineRunConditionStatusIcon(condition);

    expect(result.Icon).toBe(CircleCheck);
    expect(result.color).toBe(STATUS_COLOR.SUCCESS);
    expect(result.title).toBe("Succeeded");
    expect(result.isSpinning).toBe(false);
  });

  test("returns error icon for False status with Failed reason", () => {
    const condition: DecodedPipelineRunCondition = {
      status: "False",
      reason: "Failed",
    } as DecodedPipelineRunCondition;

    const result = getPipelineRunConditionStatusIcon(condition);

    expect(result.Icon).toBe(CircleX);
    expect(result.color).toBe(STATUS_COLOR.ERROR);
    expect(result.title).toBe("Failed");
    expect(result.isSpinning).toBe(false);
  });

  test("returns error icon for False status with CouldntGetPipeline reason", () => {
    const condition: DecodedPipelineRunCondition = {
      status: "False",
      reason: "CouldntGetPipeline",
    } as DecodedPipelineRunCondition;

    const result = getPipelineRunConditionStatusIcon(condition);

    expect(result.Icon).toBe(CircleX);
    expect(result.color).toBe(STATUS_COLOR.ERROR);
    expect(result.title).toBe("CouldntGetPipeline");
    expect(result.isSpinning).toBe(false);
  });

  test("returns suspended icon for False status with Cancelled reason", () => {
    const condition: DecodedPipelineRunCondition = {
      status: "False",
      reason: "Cancelled",
    } as DecodedPipelineRunCondition;

    const result = getPipelineRunConditionStatusIcon(condition);

    expect(result.Icon).toBe(CircleX);
    expect(result.color).toBe(STATUS_COLOR.SUSPENDED);
    expect(result.title).toBe("Cancelled");
    expect(result.isSpinning).toBe(false);
  });

  test("returns suspended icon for False status with StoppedRunFinally reason", () => {
    const condition: DecodedPipelineRunCondition = {
      status: "False",
      reason: "StoppedRunFinally",
    } as DecodedPipelineRunCondition;

    const result = getPipelineRunConditionStatusIcon(condition);

    expect(result.Icon).toBe(CircleX);
    expect(result.color).toBe(STATUS_COLOR.SUSPENDED);
    expect(result.title).toBe("StoppedRunFinally");
    expect(result.isSpinning).toBe(false);
  });

  test("returns timeout icon for False status with PipelineRunTimeout reason", () => {
    const condition: DecodedPipelineRunCondition = {
      status: "False",
      reason: "PipelineRunTimeout",
    } as DecodedPipelineRunCondition;

    const result = getPipelineRunConditionStatusIcon(condition);

    expect(result.Icon).toBe(Clock);
    expect(result.color).toBe(STATUS_COLOR.MISSING);
    expect(result.title).toBe("Timeout");
    expect(result.isSpinning).toBe(false);
  });

  test("returns error icon for False status with other reasons", () => {
    const condition: DecodedPipelineRunCondition = {
      status: "False",
      reason: "OtherError",
    } as DecodedPipelineRunCondition;

    const result = getPipelineRunConditionStatusIcon(condition);

    expect(result.Icon).toBe(CircleX);
    expect(result.color).toBe(STATUS_COLOR.ERROR);
    expect(result.title).toBe("OtherError");
    expect(result.isSpinning).toBe(false);
  });

  test("returns running icon for Unknown status with Running reason", () => {
    const condition: DecodedPipelineRunCondition = {
      status: "Unknown",
      reason: "Running",
    } as DecodedPipelineRunCondition;

    const result = getPipelineRunConditionStatusIcon(condition);

    expect(result.Icon).toBe(Loader2);
    expect(result.color).toBe(STATUS_COLOR.IN_PROGRESS);
    expect(result.title).toBe("Running");
    expect(result.isSpinning).toBe(true);
  });

  test("returns running icon for Unknown status with Started reason", () => {
    const condition: DecodedPipelineRunCondition = {
      status: "Unknown",
      reason: "Started",
    } as DecodedPipelineRunCondition;

    const result = getPipelineRunConditionStatusIcon(condition);

    expect(result.Icon).toBe(Loader2);
    expect(result.color).toBe(STATUS_COLOR.IN_PROGRESS);
    expect(result.title).toBe("Running");
    expect(result.isSpinning).toBe(true);
  });

  test("returns unknown icon for Unknown status with other reasons", () => {
    const condition: DecodedPipelineRunCondition = {
      status: "Unknown",
      reason: "Pending",
    } as DecodedPipelineRunCondition;

    const result = getPipelineRunConditionStatusIcon(condition);

    expect(result.Icon).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
    expect(result.title).toBe("Pending");
    expect(result.isSpinning).toBe(false);
  });

  test("uses reason as title when reason is provided", () => {
    const condition: DecodedPipelineRunCondition = {
      status: "False",
      reason: "CustomReason",
    } as DecodedPipelineRunCondition;

    const result = getPipelineRunConditionStatusIcon(condition);

    expect(result.title).toBe("CustomReason");
  });

  test("handles missing reason gracefully", () => {
    const condition: DecodedPipelineRunCondition = {
      status: "False",
    } as DecodedPipelineRunCondition;

    const result = getPipelineRunConditionStatusIcon(condition);

    expect(result.Icon).toBe(CircleX);
    expect(result.color).toBe(STATUS_COLOR.ERROR);
    expect(result.title).toBe("Failed");
  });
});
