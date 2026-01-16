import { describe, expect, test } from "vitest";
import { getStatusIcon } from "./index";
import { cdPipelineStatus } from "@my-project/shared";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import { CircleCheck, CircleX, LoaderCircle, ShieldQuestion } from "lucide-react";
import type { CDPipeline } from "@my-project/shared";

describe("getStatusIcon", () => {
  test("returns unknown icon for undefined status", () => {
    const cdPipeline: CDPipeline = {
      status: {},
    } as CDPipeline;

    const result = getStatusIcon(cdPipeline);

    expect(result.component).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
  });

  test("returns success icon for created status", () => {
    const cdPipeline: CDPipeline = {
      status: { status: cdPipelineStatus.created },
    } as CDPipeline;

    const result = getStatusIcon(cdPipeline);

    expect(result.component).toBe(CircleCheck);
    expect(result.color).toBe(STATUS_COLOR.SUCCESS);
  });

  test("returns error icon for failed status", () => {
    const cdPipeline: CDPipeline = {
      status: { status: cdPipelineStatus.failed },
    } as CDPipeline;

    const result = getStatusIcon(cdPipeline);

    expect(result.component).toBe(CircleX);
    expect(result.color).toBe(STATUS_COLOR.ERROR);
  });

  test("returns in-progress icon for initialized status", () => {
    const cdPipeline: CDPipeline = {
      status: { status: cdPipelineStatus.initialized },
    } as CDPipeline;

    const result = getStatusIcon(cdPipeline);

    expect(result.component).toBe(LoaderCircle);
    expect(result.color).toBe(STATUS_COLOR.IN_PROGRESS);
    expect(result.isSpinning).toBe(true);
  });

  test("returns in-progress icon for in_progress status", () => {
    const cdPipeline: CDPipeline = {
      status: { status: cdPipelineStatus.in_progress },
    } as CDPipeline;

    const result = getStatusIcon(cdPipeline);

    expect(result.component).toBe(LoaderCircle);
    expect(result.color).toBe(STATUS_COLOR.IN_PROGRESS);
    expect(result.isSpinning).toBe(true);
  });

  test("handles case-insensitive status", () => {
    const cdPipeline: CDPipeline = {
      status: { status: "CREATED" },
    } as CDPipeline;

    const result = getStatusIcon(cdPipeline);

    expect(result.component).toBe(CircleCheck);
    expect(result.color).toBe(STATUS_COLOR.SUCCESS);
  });

  test("returns unknown icon for unknown status", () => {
    const cdPipeline: CDPipeline = {
      status: { status: "unknown-status" },
    } as CDPipeline;

    const result = getStatusIcon(cdPipeline);

    expect(result.component).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
  });
});
