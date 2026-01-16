import { describe, expect, test } from "vitest";
import { getStatusIcon } from "./index";
import { codebaseStatus } from "@my-project/shared";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import { CircleCheck, CircleX, LoaderCircle, ShieldQuestion } from "lucide-react";
import type { CodebaseBranch } from "@my-project/shared";

describe("getStatusIcon", () => {
  test("returns unknown icon for undefined codebaseBranch", () => {
    const result = getStatusIcon(undefined);

    expect(result.component).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
  });

  test("returns unknown icon for undefined status", () => {
    const codebaseBranch: CodebaseBranch = {
      status: {},
    } as unknown as CodebaseBranch;

    const result = getStatusIcon(codebaseBranch);

    expect(result.component).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
  });

  test("returns success icon for created status", () => {
    const codebaseBranch: CodebaseBranch = {
      status: { status: codebaseStatus.created },
    } as unknown as CodebaseBranch;

    const result = getStatusIcon(codebaseBranch);

    expect(result.component).toBe(CircleCheck);
    expect(result.color).toBe(STATUS_COLOR.SUCCESS);
  });

  test("returns error icon for failed status", () => {
    const codebaseBranch: CodebaseBranch = {
      status: { status: codebaseStatus.failed },
    } as unknown as CodebaseBranch;

    const result = getStatusIcon(codebaseBranch);

    expect(result.component).toBe(CircleX);
    expect(result.color).toBe(STATUS_COLOR.ERROR);
  });

  test("returns in-progress icon for initialized status", () => {
    const codebaseBranch: CodebaseBranch = {
      status: { status: codebaseStatus.initialized },
    } as unknown as CodebaseBranch;

    const result = getStatusIcon(codebaseBranch);

    expect(result.component).toBe(LoaderCircle);
    expect(result.color).toBe(STATUS_COLOR.IN_PROGRESS);
    expect(result.isSpinning).toBe(true);
  });

  test("returns in-progress icon for in_progress status", () => {
    const codebaseBranch: CodebaseBranch = {
      status: { status: codebaseStatus.in_progress },
    } as unknown as CodebaseBranch;

    const result = getStatusIcon(codebaseBranch);

    expect(result.component).toBe(LoaderCircle);
    expect(result.color).toBe(STATUS_COLOR.IN_PROGRESS);
    expect(result.isSpinning).toBe(true);
  });

  test("handles case-insensitive status", () => {
    const codebaseBranch: CodebaseBranch = {
      status: { status: "CREATED" },
    } as unknown as CodebaseBranch;

    const result = getStatusIcon(codebaseBranch);

    expect(result.component).toBe(CircleCheck);
    expect(result.color).toBe(STATUS_COLOR.SUCCESS);
  });

  test("returns unknown icon for unknown status", () => {
    const codebaseBranch: CodebaseBranch = {
      status: { status: "unknown-status" },
    } as unknown as CodebaseBranch;

    const result = getStatusIcon(codebaseBranch);

    expect(result.component).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
  });
});
