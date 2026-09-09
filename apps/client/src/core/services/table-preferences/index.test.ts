import { beforeEach, describe, expect, it } from "vitest";
import { getDefaultRowsPerPage, getRowsPerPageOptions, setDefaultRowsPerPage } from "./index";

const STORAGE_KEY = "settings";
const DEFAULTS = [10, 20, 25, 50, 100];

const store = (raw: string) => localStorage.setItem(STORAGE_KEY, raw);

beforeEach(() => localStorage.clear());

describe("getDefaultRowsPerPage", () => {
  it("returns the stored value", () => {
    store(JSON.stringify({ tableDefaultRowsPerPage: 50 }));

    expect(getDefaultRowsPerPage(25)).toBe(50);
  });

  it("falls back when nothing is stored", () => {
    expect(getDefaultRowsPerPage(25)).toBe(25);
  });

  it("falls back rather than throwing on unparsable JSON", () => {
    store("{not json");

    expect(getDefaultRowsPerPage(25)).toBe(25);
  });

  it("falls back on the literal string undefined", () => {
    store("undefined");

    expect(getDefaultRowsPerPage(25)).toBe(25);
  });

  it("falls back when the envelope is not an object", () => {
    store(JSON.stringify([1, 2, 3]));
    expect(getDefaultRowsPerPage(25)).toBe(25);

    store(JSON.stringify("nope"));
    expect(getDefaultRowsPerPage(25)).toBe(25);
  });

  it("discards values that are not positive integers", () => {
    for (const value of ["50", 0, -10, 12.5, null, {}]) {
      store(JSON.stringify({ tableDefaultRowsPerPage: value }));
      expect(getDefaultRowsPerPage(25)).toBe(25);
    }
  });

  it("keeps each caller's own fallback", () => {
    expect(getDefaultRowsPerPage(10)).toBe(10);
    expect(getDefaultRowsPerPage(25)).toBe(25);
  });
});

describe("getRowsPerPageOptions", () => {
  it("returns the stored options", () => {
    store(JSON.stringify({ tableRowsPerPageOptions: [5, 15] }));

    expect(getRowsPerPageOptions()).toEqual([5, 15]);
  });

  it("returns the defaults when nothing is stored", () => {
    expect(getRowsPerPageOptions()).toEqual(DEFAULTS);
  });

  it("returns the defaults on unparsable JSON", () => {
    store("{not json");

    expect(getRowsPerPageOptions()).toEqual(DEFAULTS);
  });

  it("drops unusable entries and keeps the rest", () => {
    store(JSON.stringify({ tableRowsPerPageOptions: [10, "20", -1, 0, 50] }));

    expect(getRowsPerPageOptions()).toEqual([10, 50]);
  });

  it("returns the defaults when no entry survives", () => {
    store(JSON.stringify({ tableRowsPerPageOptions: ["a", null] }));
    expect(getRowsPerPageOptions()).toEqual(DEFAULTS);

    store(JSON.stringify({ tableRowsPerPageOptions: "10,20" }));
    expect(getRowsPerPageOptions()).toEqual(DEFAULTS);
  });
});

describe("setDefaultRowsPerPage", () => {
  it("persists the value", () => {
    setDefaultRowsPerPage(50);

    expect(getDefaultRowsPerPage(25)).toBe(50);
  });

  it("preserves sibling fields", () => {
    store(JSON.stringify({ tableRowsPerPageOptions: [5, 15], somethingElse: "keep me" }));

    setDefaultRowsPerPage(50);

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")).toEqual({
      tableRowsPerPageOptions: [5, 15],
      somethingElse: "keep me",
      tableDefaultRowsPerPage: 50,
    });
  });

  it("does not throw when the existing entry is corrupt", () => {
    store("{not json");

    expect(() => setDefaultRowsPerPage(50)).not.toThrow();
    expect(getDefaultRowsPerPage(25)).toBe(50);
  });

  it("ignores a value that is not a positive integer", () => {
    store(JSON.stringify({ tableDefaultRowsPerPage: 50 }));

    setDefaultRowsPerPage(0);
    setDefaultRowsPerPage(-5);
    setDefaultRowsPerPage(12.5);
    setDefaultRowsPerPage(Number.NaN);

    expect(getDefaultRowsPerPage(25)).toBe(50);
  });
});
