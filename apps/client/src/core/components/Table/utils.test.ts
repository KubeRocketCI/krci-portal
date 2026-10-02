import { describe, expect, it } from "vitest";
import { getFlexPropertyByTextAlign, getSelectAllState } from "./utils";

describe("getSelectAllState", () => {
  it.each([
    [0, 0, false],
    [3, 0, false],
    [3, 1, "indeterminate"],
    [3, 3, true],
  ] as const)("returns %s selectable / %s selected → %s", (selectable, selected, expected) => {
    expect(getSelectAllState(selectable, selected)).toBe(expected);
  });
});

describe("getFlexPropertyByTextAlign", () => {
  it("should return 'center' for center", () => {
    expect(getFlexPropertyByTextAlign("center")).toBe("center");
  });

  it("should return 'flex-end' for right", () => {
    expect(getFlexPropertyByTextAlign("right")).toBe("flex-end");
  });

  it("should return 'flex-start' for left", () => {
    expect(getFlexPropertyByTextAlign("left")).toBe("flex-start");
  });

  it("should return 'flex-start' for unknown values", () => {
    expect(getFlexPropertyByTextAlign("justify")).toBe("flex-start");
  });
});
