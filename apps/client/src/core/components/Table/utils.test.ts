import { describe, expect, it } from "vitest";
import {
  createSortFunction,
  createCustomSortFunction,
  isDesc,
  isAsc,
  getSortOrder,
  getFlexPropertyByTextAlign,
} from "./utils";
import { SORT_ORDERS } from "./constants";

describe("createSortFunction", () => {
  const items = [
    { name: "banana", nested: { value: "2" } },
    { name: "apple", nested: { value: "1" } },
    { name: "cherry", nested: { value: "3" } },
  ];

  it("should sort DESC (a < b returns -1)", () => {
    const sortFn = createSortFunction(SORT_ORDERS.DESC, "name");
    const sorted = [...items].sort(sortFn);
    expect(sorted.map((i) => i.name)).toEqual(["apple", "banana", "cherry"]);
  });

  it("should sort ASC (a > b returns -1)", () => {
    const sortFn = createSortFunction(SORT_ORDERS.ASC, "name");
    const sorted = [...items].sort(sortFn);
    expect(sorted.map((i) => i.name)).toEqual(["cherry", "banana", "apple"]);
  });

  it("should return 0 for UNSET", () => {
    const sortFn = createSortFunction(SORT_ORDERS.UNSET, "name");
    expect(sortFn(items[0], items[1])).toBe(0);
  });

  it("should handle nested paths", () => {
    const sortFn = createSortFunction(SORT_ORDERS.DESC, "nested.value");
    const sorted = [...items].sort(sortFn);
    expect(sorted.map((i) => i.nested.value)).toEqual(["1", "2", "3"]);
  });

  it("should handle missing properties gracefully", () => {
    const sortFn = createSortFunction(SORT_ORDERS.DESC, "nonexistent");
    expect(sortFn(items[0], items[1])).toBe(1);
  });

  it("should be case-insensitive", () => {
    const mixedCase = [{ name: "Banana" }, { name: "apple" }, { name: "CHERRY" }];
    const sortFn = createSortFunction(SORT_ORDERS.DESC, "name");
    const sorted = [...mixedCase].sort(sortFn);
    expect(sorted.map((i) => i.name)).toEqual(["apple", "Banana", "CHERRY"]);
  });

  it("should support array path", () => {
    const sortFn = createSortFunction(SORT_ORDERS.DESC, ["nested", "value"]);
    const sorted = [...items].sort(sortFn);
    expect(sorted.map((i) => i.nested.value)).toEqual(["1", "2", "3"]);
  });
});

describe("createCustomSortFunction", () => {
  const customSort = (a: number, b: number) => a - b;

  it("should return noop function when customSortFn is undefined", () => {
    const sortFn = createCustomSortFunction(SORT_ORDERS.DESC, undefined);
    expect(sortFn(1, 2)).toBe(0);
  });

  it("should call customSortFn(a, b) for DESC", () => {
    const sortFn = createCustomSortFunction(SORT_ORDERS.DESC, customSort);
    expect(sortFn(1, 2)).toBe(-1);
  });

  it("should call customSortFn(b, a) for ASC", () => {
    const sortFn = createCustomSortFunction(SORT_ORDERS.ASC, customSort);
    expect(sortFn(1, 2)).toBe(1);
  });

  it("should return 0 for UNSET", () => {
    const sortFn = createCustomSortFunction(SORT_ORDERS.UNSET, customSort);
    expect(sortFn(1, 2)).toBe(0);
  });
});

describe("isDesc", () => {
  it("should return true when columnId matches sortBy and order is DESC", () => {
    expect(isDesc("name", "name", SORT_ORDERS.DESC)).toBe(true);
  });

  it("should return false when columnId does not match", () => {
    expect(isDesc("name", "other", SORT_ORDERS.DESC)).toBe(false);
  });

  it("should return false when order is not DESC", () => {
    expect(isDesc("name", "name", SORT_ORDERS.ASC)).toBe(false);
  });
});

describe("isAsc", () => {
  it("should return true when columnId matches sortBy and order is ASC", () => {
    expect(isAsc("name", "name", SORT_ORDERS.ASC)).toBe(true);
  });

  it("should return false when columnId does not match", () => {
    expect(isAsc("name", "other", SORT_ORDERS.ASC)).toBe(false);
  });

  it("should return false when order is not ASC", () => {
    expect(isAsc("name", "name", SORT_ORDERS.DESC)).toBe(false);
  });
});

describe("getSortOrder", () => {
  it("should return ASC when isDesc is true", () => {
    expect(getSortOrder(true, false)).toBe(SORT_ORDERS.ASC);
  });

  it("should return UNSET when isAsc is true", () => {
    expect(getSortOrder(false, true)).toBe(SORT_ORDERS.UNSET);
  });

  it("should return DESC when neither isDesc nor isAsc", () => {
    expect(getSortOrder(false, false)).toBe(SORT_ORDERS.DESC);
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
