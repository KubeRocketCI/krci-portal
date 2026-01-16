import { describe, expect, test } from "vitest";
import { getStatusIcon } from "./index";
import { stageStatus } from "@my-project/shared";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import { CircleCheck, CircleX, LoaderCircle, ShieldQuestion } from "lucide-react";
import type { Stage } from "@my-project/shared";

describe("getStatusIcon", () => {
  test("returns unknown icon for undefined status", () => {
    const stage: Stage = {
      status: {},
    } as unknown as Stage;

    const result = getStatusIcon(stage);

    expect(result.component).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
  });

  test("returns success icon for created status", () => {
    const stage: Stage = {
      status: { status: stageStatus.created },
    } as unknown as Stage;

    const result = getStatusIcon(stage);

    expect(result.component).toBe(CircleCheck);
    expect(result.color).toBe(STATUS_COLOR.SUCCESS);
  });

  test("returns error icon for failed status", () => {
    const stage: Stage = {
      status: { status: stageStatus.failed },
    } as unknown as Stage;

    const result = getStatusIcon(stage);

    expect(result.component).toBe(CircleX);
    expect(result.color).toBe(STATUS_COLOR.ERROR);
  });

  test("returns in-progress icon for initialized status", () => {
    const stage: Stage = {
      status: { status: stageStatus.initialized },
    } as unknown as Stage;

    const result = getStatusIcon(stage);

    expect(result.component).toBe(LoaderCircle);
    expect(result.color).toBe(STATUS_COLOR.IN_PROGRESS);
    expect(result.isSpinning).toBe(true);
  });

  test("returns in-progress icon for in_progress status", () => {
    const stage: Stage = {
      status: { status: stageStatus.in_progress },
    } as unknown as Stage;

    const result = getStatusIcon(stage);

    expect(result.component).toBe(LoaderCircle);
    expect(result.color).toBe(STATUS_COLOR.IN_PROGRESS);
    expect(result.isSpinning).toBe(true);
  });

  test("handles case-insensitive status", () => {
    const stage: Stage = {
      status: { status: "CREATED" },
    } as unknown as Stage;

    const result = getStatusIcon(stage);

    expect(result.component).toBe(CircleCheck);
    expect(result.color).toBe(STATUS_COLOR.SUCCESS);
  });

  test("returns unknown icon for unknown status", () => {
    const stage: Stage = {
      status: { status: "unknown-status" },
    } as unknown as Stage;

    const result = getStatusIcon(stage);

    expect(result.component).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
  });
});
