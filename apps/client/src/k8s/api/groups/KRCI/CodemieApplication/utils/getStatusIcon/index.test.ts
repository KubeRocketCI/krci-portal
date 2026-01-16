import { describe, expect, test } from "vitest";
import { getCodemieApplicationStatusIcon } from "./index";
import { codemieApplicationStatus } from "@my-project/shared";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import { CircleCheck, CircleX, ShieldQuestion } from "lucide-react";
import type { CodemieApplication } from "@my-project/shared";

describe("getCodemieApplicationStatusIcon", () => {
  test("returns unknown icon for undefined codemieApplication", () => {
    const result = getCodemieApplicationStatusIcon(undefined);

    expect(result.component).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
  });

  test("returns unknown icon for undefined status", () => {
    const codemieApplication: CodemieApplication = {
      status: {},
    } as unknown as CodemieApplication;

    const result = getCodemieApplicationStatusIcon(codemieApplication);

    expect(result.component).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
  });

  test("returns success icon for created status", () => {
    const codemieApplication: CodemieApplication = {
      status: { value: codemieApplicationStatus.created },
    } as unknown as CodemieApplication;

    const result = getCodemieApplicationStatusIcon(codemieApplication);

    expect(result.component).toBe(CircleCheck);
    expect(result.color).toBe(STATUS_COLOR.SUCCESS);
  });

  test("returns error icon for error status", () => {
    const codemieApplication: CodemieApplication = {
      status: { value: codemieApplicationStatus.error },
    } as unknown as CodemieApplication;

    const result = getCodemieApplicationStatusIcon(codemieApplication);

    expect(result.component).toBe(CircleX);
    expect(result.color).toBe(STATUS_COLOR.ERROR);
  });

  test("handles case-insensitive status", () => {
    const codemieApplication: CodemieApplication = {
      status: { value: "CREATED" },
    } as unknown as CodemieApplication;

    const result = getCodemieApplicationStatusIcon(codemieApplication);

    expect(result.component).toBe(CircleCheck);
    expect(result.color).toBe(STATUS_COLOR.SUCCESS);
  });

  test("returns unknown icon for unknown status", () => {
    const codemieApplication: CodemieApplication = {
      status: { value: "unknown-status" },
    } as unknown as CodemieApplication;

    const result = getCodemieApplicationStatusIcon(codemieApplication);

    expect(result.component).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
  });
});
