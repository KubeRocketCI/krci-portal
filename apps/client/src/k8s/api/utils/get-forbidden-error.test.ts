import { describe, expect, test } from "vitest";
import { getForbiddenError } from "./get-forbidden-error";
import type { RequestError } from "@/core/types/global";

describe("getForbiddenError", () => {
  test("returns error when httpStatus is 403", () => {
    const error: RequestError = {
      data: {
        httpStatus: 403,
        message: "Forbidden",
      },
    } as unknown as RequestError;

    const result = getForbiddenError(error);

    expect(result).toEqual(error);
  });

  test("returns null when httpStatus is not 403", () => {
    const error: RequestError = {
      data: {
        httpStatus: 404,
        message: "Not Found",
      },
    } as unknown as RequestError;

    const result = getForbiddenError(error);

    expect(result).toBeNull();
  });

  test("returns null when httpStatus is 401", () => {
    const error: RequestError = {
      data: {
        httpStatus: 401,
        message: "Unauthorized",
      },
    } as unknown as RequestError;

    const result = getForbiddenError(error);

    expect(result).toBeNull();
  });

  test("returns null when httpStatus is 500", () => {
    const error: RequestError = {
      data: {
        httpStatus: 500,
        message: "Internal Server Error",
      },
    } as unknown as RequestError;

    const result = getForbiddenError(error);

    expect(result).toBeNull();
  });

  test("returns null when data is missing", () => {
    const error: RequestError = {} as RequestError;

    const result = getForbiddenError(error);

    expect(result).toBeNull();
  });

  test("returns null when httpStatus is missing", () => {
    const error: RequestError = {
      data: {
        message: "Error",
      },
    } as unknown as RequestError;

    const result = getForbiddenError(error);

    expect(result).toBeNull();
  });

  test("returns null when error is undefined", () => {
    const error: RequestError = undefined as unknown as RequestError;

    const result = getForbiddenError(error);

    expect(result).toBeNull();
  });

  test("returns null when error is null", () => {
    const error: RequestError = null as unknown as RequestError;

    const result = getForbiddenError(error);

    expect(result).toBeNull();
  });

  test("handles error with additional properties", () => {
    const error: RequestError = {
      data: {
        httpStatus: 403,
        message: "Forbidden",
        details: "Additional details",
        code: "ERR_FORBIDDEN",
      },
    } as unknown as RequestError;

    const result = getForbiddenError(error);

    expect(result).toEqual(error);
  });
});
