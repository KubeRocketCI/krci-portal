import { describe, expect, it } from "vitest";
import { getApplicationSyncStatus } from "./index.js";

describe("getApplicationSyncStatus", () => {
  it("should return sync status from application.status.sync.status", () => {
    const app = {
      status: {
        sync: { status: "Synced" },
      },
    } as any;
    expect(getApplicationSyncStatus(app)).toEqual({ status: "synced" });
  });

  it("should lowercase status", () => {
    const app = {
      status: {
        sync: { status: "OutOfSync" },
      },
    } as any;
    expect(getApplicationSyncStatus(app)).toEqual({ status: "outofsync" });
  });

  it("should return Unknown when status is missing", () => {
    expect(getApplicationSyncStatus({} as any)).toEqual({ status: "Unknown" });
    expect(getApplicationSyncStatus({ status: {} } as any)).toEqual({ status: "Unknown" });
    expect(getApplicationSyncStatus({ status: { sync: {} } } as any)).toEqual({ status: "Unknown" });
  });

  it("should return Unknown when application is undefined", () => {
    expect(getApplicationSyncStatus(undefined as any)).toEqual({ status: "Unknown" });
  });
});
