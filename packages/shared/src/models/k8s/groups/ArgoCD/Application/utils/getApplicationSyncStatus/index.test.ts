import { describe, expect, it } from "vitest";
import { getApplicationStatus } from "./index.js";

describe("getApplicationStatus", () => {
  it("should return health status from application.status.health.status", () => {
    const app = {
      status: {
        health: { status: "Healthy" },
      },
    } as any;
    expect(getApplicationStatus(app)).toEqual({ status: "healthy" });
  });

  it("should lowercase status", () => {
    const app = {
      status: {
        health: { status: "Degraded" },
      },
    } as any;
    expect(getApplicationStatus(app)).toEqual({ status: "degraded" });
  });

  it("should return Unknown when status is missing", () => {
    expect(getApplicationStatus({} as any)).toEqual({ status: "Unknown" });
    expect(getApplicationStatus({ status: {} } as any)).toEqual({ status: "Unknown" });
    expect(getApplicationStatus({ status: { health: {} } } as any)).toEqual({ status: "Unknown" });
  });

  it("should return Unknown when application is undefined", () => {
    expect(getApplicationStatus(undefined as any)).toEqual({ status: "Unknown" });
  });
});
