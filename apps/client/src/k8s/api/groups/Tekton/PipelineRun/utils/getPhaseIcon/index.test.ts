import { describe, expect, test } from "vitest";
import { getPhaseIcon } from "./index";
import { pipelineRunPhase } from "@my-project/shared";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import { CircleCheck, CircleSlash, CircleX, LoaderCircle, ShieldQuestion } from "lucide-react";

describe("getPhaseIcon", () => {
  test("returns spinning in-progress icon for in-progress phase", () => {
    const result = getPhaseIcon(pipelineRunPhase["in-progress"]);

    expect(result.component).toBe(LoaderCircle);
    expect(result.color).toBe(STATUS_COLOR.IN_PROGRESS);
    expect(result.isSpinning).toBe(true);
  });

  test("returns spinning cancelled icon for cancelling phase", () => {
    const result = getPhaseIcon(pipelineRunPhase.cancelling);

    expect(result.component).toBe(CircleSlash);
    expect(result.color).toBe(STATUS_COLOR.CANCELLED);
    expect(result.isSpinning).toBe(true);
  });

  test("returns non-spinning cancelled icon for cancelled phase", () => {
    const result = getPhaseIcon(pipelineRunPhase.cancelled);

    expect(result.component).toBe(CircleSlash);
    expect(result.color).toBe(STATUS_COLOR.CANCELLED);
    expect(result.isSpinning).toBeFalsy();
  });

  test("returns success icon for succeeded phase", () => {
    const result = getPhaseIcon(pipelineRunPhase.succeeded);

    expect(result.component).toBe(CircleCheck);
    expect(result.color).toBe(STATUS_COLOR.SUCCESS);
  });

  test("returns error icon for failed phase", () => {
    const result = getPhaseIcon(pipelineRunPhase.failed);

    expect(result.component).toBe(CircleX);
    expect(result.color).toBe(STATUS_COLOR.ERROR);
  });

  test("returns unknown icon for unknown phase", () => {
    const result = getPhaseIcon(pipelineRunPhase.unknown);

    expect(result.component).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
  });
});
