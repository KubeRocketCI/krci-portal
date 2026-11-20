import { describe, expect, it } from "vitest";

import { parseSecuritySeverityQuery } from "./security-helpers.js";

describe("parseSecuritySeverityQuery", () => {
  it.each([undefined, "", ",", " , "])("returns undefined for %j", (raw) => {
    expect(parseSecuritySeverityQuery(raw)).toBeUndefined();
  });

  it("parses a comma-separated list", () => {
    expect(parseSecuritySeverityQuery("critical,high")).toEqual([
      "critical",
      "high",
    ]);
  });

  it("parses repeated parameters", () => {
    expect(parseSecuritySeverityQuery(["low", "unassigned"])).toEqual([
      "low",
      "unassigned",
    ]);
  });

  it("accepts every severity", () => {
    expect(
      parseSecuritySeverityQuery("critical,high,medium,low,unassigned")
    ).toEqual(["critical", "high", "medium", "low", "unassigned"]);
  });

  it("ignores case and whitespace", () => {
    expect(parseSecuritySeverityQuery(" HIGH , Medium ")).toEqual([
      "high",
      "medium",
    ]);
  });

  it("drops duplicates", () => {
    expect(parseSecuritySeverityQuery(["high,high", "high"])).toEqual(["high"]);
  });

  it.each(["info", "critical,bogus", ["high", "nope"]])(
    "returns invalid for %j",
    (raw) => {
      expect(parseSecuritySeverityQuery(raw)).toBe("invalid");
    }
  );
});
