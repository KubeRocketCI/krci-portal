import { describe, expect, test } from "vitest";
import { getStatusIcon } from "./index";
import { applicationHealthStatus } from "@my-project/shared";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import { CirclePause, Ghost, Heart, HeartCrack, LoaderCircle, ShieldQuestion } from "lucide-react";
import type { Application } from "@my-project/shared";

describe("getStatusIcon", () => {
  test("returns unknown icon for undefined status", () => {
    const application: Application = {
      status: {},
    } as unknown as Application;

    const result = getStatusIcon(application);

    expect(result.component).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
  });

  test("returns success icon for healthy status", () => {
    const application: Application = {
      status: {
        health: { status: applicationHealthStatus.healthy },
      },
    } as unknown as Application;

    const result = getStatusIcon(application);

    expect(result.component).toBe(Heart);
    expect(result.color).toBe(STATUS_COLOR.SUCCESS);
  });

  test("returns in-progress icon for progressing status", () => {
    const application: Application = {
      status: {
        health: { status: applicationHealthStatus.progressing },
      },
    } as unknown as Application;

    const result = getStatusIcon(application);

    expect(result.component).toBe(LoaderCircle);
    expect(result.color).toBe(STATUS_COLOR.IN_PROGRESS);
    expect(result.isSpinning).toBe(true);
  });

  test("returns error icon for degraded status", () => {
    const application: Application = {
      status: {
        health: { status: applicationHealthStatus.degraded },
      },
    } as unknown as Application;

    const result = getStatusIcon(application);

    expect(result.component).toBe(HeartCrack);
    expect(result.color).toBe(STATUS_COLOR.ERROR);
  });

  test("returns suspended icon for suspended status", () => {
    const application: Application = {
      status: {
        health: { status: applicationHealthStatus.suspended },
      },
    } as unknown as Application;

    const result = getStatusIcon(application);

    expect(result.component).toBe(CirclePause);
    expect(result.color).toBe(STATUS_COLOR.SUSPENDED);
  });

  test("returns missing icon for missing status", () => {
    const application: Application = {
      status: {
        health: { status: applicationHealthStatus.missing },
      },
    } as unknown as Application;

    const result = getStatusIcon(application);

    expect(result.component).toBe(Ghost);
    expect(result.color).toBe(STATUS_COLOR.MISSING);
  });

  test("returns unknown icon for unknown status", () => {
    const application: Application = {
      status: {
        health: { status: "unknown-status" },
      },
    } as unknown as Application;

    const result = getStatusIcon(application);

    expect(result.component).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
  });
});
