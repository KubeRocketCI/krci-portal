import { describe, expect, test, vi } from "vitest";
import { getIntegrationSecretStatusIcon, getClusterSecretStatusIcon } from "./index";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import { CircleCheck, CircleX, ShieldQuestion } from "lucide-react";
import type { Secret } from "@my-project/shared";

// Mock the shared functions
vi.mock("@my-project/shared", async () => {
  const actual = await vi.importActual("@my-project/shared");
  return {
    ...actual,
    getIntegrationSecretStatus: (secret: Secret & { status?: { connected: string } }) => {
      return {
        connected: secret.status?.connected || "unknown",
      };
    },
    getClusterSecretStatus: (secret: Secret & { status?: { connected: string } }) => {
      return {
        connected: secret.status?.connected || "unknown",
      };
    },
  };
});

describe("getIntegrationSecretStatusIcon", () => {
  test("returns success icon when connected is true", () => {
    const secret: Secret = {
      status: {
        connected: "true",
      },
    } as unknown as Secret;

    const result = getIntegrationSecretStatusIcon(secret);

    expect(result.component).toBe(CircleCheck);
    expect(result.color).toBe(STATUS_COLOR.SUCCESS);
  });

  test("returns error icon when connected is false", () => {
    const secret: Secret = {
      status: {
        connected: "false",
      },
    } as unknown as Secret;

    const result = getIntegrationSecretStatusIcon(secret);

    expect(result.component).toBe(CircleX);
    expect(result.color).toBe(STATUS_COLOR.ERROR);
  });

  test("returns unknown icon when connected is unknown", () => {
    const secret: Secret = {
      status: {
        connected: "unknown",
      },
    } as unknown as Secret;

    const result = getIntegrationSecretStatusIcon(secret);

    expect(result.component).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
  });

  test("returns unknown icon when status is not set", () => {
    const secret: Secret = {} as Secret;

    const result = getIntegrationSecretStatusIcon(secret);

    expect(result.component).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
  });

  test("returns unknown icon for other connected values", () => {
    const secret: Secret = {
      status: {
        connected: "pending",
      },
    } as unknown as Secret;

    const result = getIntegrationSecretStatusIcon(secret);

    expect(result.component).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
  });
});

describe("getClusterSecretStatusIcon", () => {
  test("returns success icon when connected is true", () => {
    const secret: Secret = {
      status: {
        connected: "true",
      },
    } as unknown as Secret;

    const result = getClusterSecretStatusIcon(secret);

    expect(result.component).toBe(CircleCheck);
    expect(result.color).toBe(STATUS_COLOR.SUCCESS);
  });

  test("returns error icon when connected is false", () => {
    const secret: Secret = {
      status: {
        connected: "false",
      },
    } as unknown as Secret;

    const result = getClusterSecretStatusIcon(secret);

    expect(result.component).toBe(CircleX);
    expect(result.color).toBe(STATUS_COLOR.ERROR);
  });

  test("returns unknown icon when connected is unknown", () => {
    const secret: Secret = {
      status: {
        connected: "unknown",
      },
    } as unknown as Secret;

    const result = getClusterSecretStatusIcon(secret);

    expect(result.component).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
  });

  test("returns unknown icon when status is not set", () => {
    const secret: Secret = {} as Secret;

    const result = getClusterSecretStatusIcon(secret);

    expect(result.component).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
  });

  test("returns unknown icon for other connected values", () => {
    const secret: Secret = {
      status: {
        connected: "pending",
      },
    } as unknown as Secret;

    const result = getClusterSecretStatusIcon(secret);

    expect(result.component).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
  });
});
