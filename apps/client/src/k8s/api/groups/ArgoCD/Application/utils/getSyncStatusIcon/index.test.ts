import { describe, expect, test, vi } from "vitest";
import { getSyncStatusIcon } from "./index";
import { applicationSyncStatus } from "@my-project/shared";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import { CheckCircle, CircleArrowUp, LoaderCircle, ShieldQuestion } from "lucide-react";
import type { Application } from "@my-project/shared";

// Mock the shared function
vi.mock("@my-project/shared", async () => {
  const actual = await vi.importActual("@my-project/shared");
  return {
    ...actual,
    getApplicationSyncStatus: (application: Application) => {
      return { status: application.status?.sync?.status };
    },
  };
});

describe("getSyncStatusIcon", () => {
  test("returns unknown icon for undefined status", () => {
    const application: Application = {
      status: {},
    } as unknown as Application;

    const result = getSyncStatusIcon(application);

    expect(result.component).toBe(ShieldQuestion);
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

