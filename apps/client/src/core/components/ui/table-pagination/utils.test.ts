import { describe, expect, it } from "vitest";
import { isKnownTotal } from "./utils";

describe("isKnownTotal", () => {
  it.each([0, 5])("accepts %s", (value) => {
    expect(isKnownTotal(value)).toBe(true);
  });

  it.each([-1, NaN, Infinity, 1.5, "5", undefined])("rejects %s", (value) => {
    expect(isKnownTotal(value)).toBe(false);
  });
});
