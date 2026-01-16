import { describe, expect, test } from "vitest";
import { getStatusIcon } from "./index";
import { codebaseStatus } from "@my-project/shared";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import { CircleCheck, CircleX, LoaderCircle, ShieldQuestion } from "lucide-react";
import type { Codebase } from "@my-project/shared";

describe("getStatusIcon", () => {
  test("returns unknown icon for undefined status", () => {
    const codebase: Codebase = {
      status: {},
    } as unknown as Codebase;

    const result = getStatusIcon(codebase);

    expect(result.component).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
  });

  test("returns success icon for created status", () => {
    const codebase: Codebase = {
      status: { status: codebaseStatus.created },
    } as unknown as Codebase;

    const result = getStatusIcon(codebase);

    expect(result.component).toBe(CircleCheck);
    expect(result.color).toBe(STATUS_COLOR.SUCCESS);
  });

  test("returns error icon for failed status", () => {
    const codebase: Codebase = {
      status: { status: codebaseStatus.failed },
    } as unknown as Codebase;

    const result = getStatusIcon(codebase);

    expect(result.component).toBe(CircleX);
    expect(result.color).toBe(STATUS_COLOR.ERROR);
  });

  test("returns in-progress icon for initialized status", () => {
    const codebase: Codebase = {
      status: { status: codebaseStatus.initialized },
    } as unknown as Codebase;

    const result = getStatusIcon(codebase);

    expect(result.component).toBe(LoaderCircle);
    expect(result.color).toBe(STATUS_COLOR.IN_PROGRESS);
    expect(result.isSpinning).toBe(true);
  });

  test("returns in-progress icon for in_progress status", () => {
    const codebase: Codebase = {
      status: { status: codebaseStatus.in_progress },
    } as unknown as Codebase;

    const result = getStatusIcon(codebase);

    expect(result.component).toBe(LoaderCircle);
    expect(result.color).toBe(STATUS_COLOR.IN_PROGRESS);
    expect(result.isSpinning).toBe(true);
  });

  test("handles case-insensitive status", () => {
    const codebase: Codebase = {
      status: { status: "CREATED" },
    } as unknown as Codebase;

    const result = getStatusIcon(codebase);

    expect(result.component).toBe(CircleCheck);
    expect(result.color).toBe(STATUS_COLOR.SUCCESS);
  });

  test("returns unknown icon for unknown status", () => {
    const codebase: Codebase = {
      status: { status: "unknown-status" },
    } as unknown as Codebase;

    const result = getStatusIcon(codebase);

    expect(result.component).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
  });
});
