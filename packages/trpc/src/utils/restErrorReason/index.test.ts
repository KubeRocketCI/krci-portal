import { describe, expect, it } from "vitest";
import { REST_ERROR_REASONS, toRestErrorReason, validationCause } from "./index.js";

describe("toRestErrorReason", () => {
  it.each(REST_ERROR_REASONS)("maps the public tag %s to itself", (reason) => {
    expect(toRestErrorReason(reason)).toBe(reason);
  });

  it.each([
    "SENTINEL-LEAK",
    "NotFound",
    "Forbidden",
    "codebase_not_found ",
    "CODEBASE_NOT_FOUND",
    "",
    42,
    null,
    undefined,
    {},
    ["codebase_not_found"],
  ])("rejects %j", (value) => {
    expect(toRestErrorReason(value)).toBeUndefined();
  });
});

describe("validationCause", () => {
  it("tags the reason with the validation source", () => {
    expect(validationCause("build_in_progress")).toEqual({
      source: "validation",
      reason: "build_in_progress",
    });
  });
});
