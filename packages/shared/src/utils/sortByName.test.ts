import { describe, expect, it } from "vitest";
import { sortByName } from "./sortByName.js";

describe("sortByName", () => {
  it("orders names alphabetically", () => {
    expect(["beta", "alpha", "gamma"].sort(sortByName)).toEqual(["alpha", "beta", "gamma"]);
  });

  it("treats names that differ only by case as equal", () => {
    expect(sortByName("a", "A")).toBe(0);
  });

  it("tells accented names apart", () => {
    expect(sortByName("a", "á")).not.toBe(0);
  });

  it("ranks a missing name after a present one", () => {
    expect(sortByName("a", undefined)).toBe(-1);
    expect(sortByName(undefined, "a")).toBe(1);
    expect(sortByName(undefined, undefined)).toBe(0);
  });
});
