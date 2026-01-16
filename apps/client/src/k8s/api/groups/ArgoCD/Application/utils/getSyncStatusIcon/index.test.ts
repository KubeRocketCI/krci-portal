import { describe, expect, test } from "vitest";
import { getSyncStatusIcon } from "./index";
import { applicationSyncStatus } from "@my-project/shared";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import { CheckCircle, CircleArrowUp, LoaderCircle } from "lucide-react";
import type { Application } from "@my-project/shared";

describe("getSyncStatusIcon", () => {
  test("returns unknown icon for undefined status", () => {
    const application: Application = {
      status: {},
    } as unknown as Application;

    const result = getSyncStatusIcon(application);

    // getApplicationSyncStatus returns "Unknown" (capital U) for undefined status,
    // which doesn't match any enum case, so it falls through to default case
    expect(result.component).toBe(LoaderCircle);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
  });

  test("returns success icon for synced status", () => {
    const application: Application = {
      status: {
        sync: { status: applicationSyncStatus.synced },
      },
    } as unknown as Application;

    const result = getSyncStatusIcon(application);

    expect(result.component).toBe(CheckCircle);
    expect(result.color).toBe(STATUS_COLOR.SUCCESS);
  });

  test("returns missing icon for outofsync status", () => {
    const application: Application = {
      status: {
        sync: { status: applicationSyncStatus.outofsync },
      },
    } as unknown as Application;

    const result = getSyncStatusIcon(application);

    expect(result.component).toBe(CircleArrowUp);
    expect(result.color).toBe(STATUS_COLOR.MISSING);
  });

  test("returns unknown icon for unknown status", () => {
    const application: Application = {
      status: {
        sync: { status: "unknown-status" },
      },
    } as unknown as Application;

    const result = getSyncStatusIcon(application);

    expect(result.component).toBe(LoaderCircle);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
  });
});
