import { describe, expect, it } from "vitest";
import { getNonDefaultFilterValues } from "./utils";

const defaults = { search: "", status: "all", codebases: [] as string[], flag: false };

describe("getNonDefaultFilterValues", () => {
  it("returns an empty object for default values", () => {
    expect(getNonDefaultFilterValues(defaults, defaults)).toEqual({});
  });

  it("keeps non-empty arrays, changed strings and changed scalars", () => {
    expect(
      getNonDefaultFilterValues({ search: "x", status: "failed", codebases: ["a", "b"], flag: true }, defaults)
    ).toEqual({ search: "x", status: "failed", codebases: ["a", "b"], flag: true });
  });

  it("treats an empty array and an empty string as default", () => {
    expect(getNonDefaultFilterValues({ ...defaults, status: "", codebases: [] }, defaults)).toEqual({});
  });

  it("ignores keys outside filterKeys and missing keys", () => {
    expect(getNonDefaultFilterValues({ search: "x", status: "failed" }, defaults, ["status"])).toEqual({
      status: "failed",
    });
  });
});
