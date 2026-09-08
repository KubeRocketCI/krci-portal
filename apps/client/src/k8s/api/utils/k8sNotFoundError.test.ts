import { describe, expect, test } from "vitest";
import { createK8sNotFoundError, isK8sNotFoundError } from "./k8sNotFoundError";
import type { RequestError } from "@/core/types/global";

const asError = (error: unknown): RequestError => error as RequestError;

describe("isK8sNotFoundError", () => {
  test("detects httpStatus 404", () => {
    expect(isK8sNotFoundError(asError({ data: { httpStatus: 404 } }))).toBe(true);
  });

  test("detects the NOT_FOUND code when the status was widened to 500", () => {
    expect(isK8sNotFoundError(asError({ data: { httpStatus: 500, code: "NOT_FOUND" } }))).toBe(true);
  });

  test("falls back to the message when neither signal survives", () => {
    expect(
      isK8sNotFoundError(asError({ message: 'Kubernetes API request failed: 404 Not Found. {"kind":"Status"}' }))
    ).toBe(true);
  });

  test("returns false for another K8s status", () => {
    expect(isK8sNotFoundError(asError({ data: { httpStatus: 403 }, message: "Forbidden" }))).toBe(false);
  });

  test("returns false without any signal", () => {
    expect(isK8sNotFoundError(asError({ data: {} }))).toBe(false);
    expect(isK8sNotFoundError(asError({}))).toBe(false);
    expect(isK8sNotFoundError(null)).toBe(false);
  });
});

describe("createK8sNotFoundError", () => {
  test("builds an error the detector accepts", () => {
    const error = createK8sNotFoundError('secrets "ci-sonarqube" not found');

    expect(isK8sNotFoundError(error)).toBe(true);
    expect(error.data?.httpStatus).toBe(404);
    expect(error.message).toBe('secrets "ci-sonarqube" not found');
  });
});
