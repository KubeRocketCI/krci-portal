import { describe, expect, test } from "vitest";
import { getIntegrationSecretStatusIcon, getClusterSecretStatusIcon } from "./index";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import { CircleCheck, CircleX, ShieldQuestion } from "lucide-react";
import type { Secret } from "@my-project/shared";
import {
  SECRET_ANNOTATION_INTEGRATION_SECRET_CONNECTED,
  SECRET_ANNOTATION_CLUSTER_CONNECTED,
} from "@my-project/shared";

describe("getIntegrationSecretStatusIcon", () => {
  test("returns success icon when connected is true", () => {
    const secret: Secret = {
      metadata: {
        annotations: {
          [SECRET_ANNOTATION_INTEGRATION_SECRET_CONNECTED]: "true",
        },
      },
    } as unknown as Secret;

    const result = getIntegrationSecretStatusIcon(secret);

    expect(result.component).toBe(CircleCheck);
    expect(result.color).toBe(STATUS_COLOR.SUCCESS);
  });

  test("returns error icon when connected is false", () => {
    const secret: Secret = {
      metadata: {
        annotations: {
          [SECRET_ANNOTATION_INTEGRATION_SECRET_CONNECTED]: "false",
        },
      },
    } as unknown as Secret;

    const result = getIntegrationSecretStatusIcon(secret);

    expect(result.component).toBe(CircleX);
    expect(result.color).toBe(STATUS_COLOR.ERROR);
  });

  test("returns unknown icon when connected is unknown", () => {
    const secret: Secret = {
      metadata: {
        annotations: {
          [SECRET_ANNOTATION_INTEGRATION_SECRET_CONNECTED]: "unknown",
        },
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
      metadata: {
        annotations: {
          [SECRET_ANNOTATION_INTEGRATION_SECRET_CONNECTED]: "pending",
        },
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
      metadata: {
        annotations: {
          [SECRET_ANNOTATION_CLUSTER_CONNECTED]: "true",
        },
      },
    } as unknown as Secret;

    const result = getClusterSecretStatusIcon(secret);

    expect(result.component).toBe(CircleCheck);
    expect(result.color).toBe(STATUS_COLOR.SUCCESS);
  });

  test("returns error icon when connected is false", () => {
    const secret: Secret = {
      metadata: {
        annotations: {
          [SECRET_ANNOTATION_CLUSTER_CONNECTED]: "false",
        },
      },
    } as unknown as Secret;

    const result = getClusterSecretStatusIcon(secret);

    expect(result.component).toBe(CircleX);
    expect(result.color).toBe(STATUS_COLOR.ERROR);
  });

  test("returns unknown icon when connected is unknown", () => {
    const secret: Secret = {
      metadata: {
        annotations: {
          [SECRET_ANNOTATION_CLUSTER_CONNECTED]: "unknown",
        },
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
      metadata: {
        annotations: {
          [SECRET_ANNOTATION_CLUSTER_CONNECTED]: "pending",
        },
      },
    } as unknown as Secret;

    const result = getClusterSecretStatusIcon(secret);

    expect(result.component).toBe(ShieldQuestion);
    expect(result.color).toBe(STATUS_COLOR.UNKNOWN);
  });
});
