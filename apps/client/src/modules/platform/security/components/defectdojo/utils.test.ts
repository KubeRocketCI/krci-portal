import type { ScanFinding } from "@my-project/shared";
import { describe, expect, it } from "vitest";
import { NO_VALUE } from "./constants";
import { formatFix, formatLocation, formatScanTime, getFindingStates } from "./utils";

function finding(overrides: Partial<ScanFinding> = {}): ScanFinding {
  return {
    title: "A finding",
    severity: "High",
    active: true,
    mitigated: false,
    falsePositive: false,
    outOfScope: false,
    riskAccepted: false,
    underReview: false,
    date: null,
    componentName: null,
    componentVersion: null,
    vulnerabilityIds: [],
    filePath: null,
    line: null,
    fixAvailable: null,
    fixVersion: null,
    url: "https://defectdojo.example.test/finding/1",
    ...overrides,
  };
}

describe("formatFix", () => {
  it.each([
    [
      "names the version when the scanner fills it",
      { fixAvailable: true, fixVersion: "3.1.4" },
      "Fix available: 3.1.4",
    ],
    [
      "says a fix is available when the scanner fills no version",
      { fixAvailable: true, fixVersion: null },
      "Fix available",
    ],
    ["says there is no fix when the scanner says so", { fixAvailable: false, fixVersion: null }, "No fix"],
    ["says nothing when the scanner does not say", { fixAvailable: null, fixVersion: null }, NO_VALUE],
  ])("%s", (_, fix, expected) => {
    expect(formatFix(finding(fix))).toBe(expected);
  });

  it("names the fix version even when the scanner leaves fix availability open", () => {
    expect(formatFix(finding({ fixAvailable: null, fixVersion: "2.0.0" }))).toBe("Fix available: 2.0.0");
  });
});

describe("getFindingStates", () => {
  it("is empty for an active finding", () => {
    expect(getFindingStates(finding())).toEqual([]);
  });

  it("lists every triage state of a finding, in display order", () => {
    expect(
      getFindingStates(
        finding({
          active: false,
          falsePositive: true,
          outOfScope: true,
          riskAccepted: true,
          mitigated: true,
          underReview: true,
        })
      )
    ).toEqual(["False positive", "Out of scope", "Risk accepted", "Mitigated", "Under review"]);
  });
});

describe("formatLocation", () => {
  it.each([
    ["the file and the line", { filePath: "cmd/main.go", line: 42 }, "cmd/main.go:42"],
    ["the file alone when the scanner gives no line", { filePath: "config/app.env", line: null }, "config/app.env"],
    ["a dash when the finding has no file", { filePath: null, line: null }, NO_VALUE],
  ])("is %s", (_, place, expected) => {
    expect(formatLocation(finding(place))).toBe(expected);
  });
});

describe("formatScanTime", () => {
  it("formats the date of an upload", () => {
    expect(formatScanTime("2026-11-23T10:09:17.796534Z")).toContain("2026");
  });

  it.each([null, "", "not a date"])("is a dash for %j", (value) => {
    expect(formatScanTime(value)).toBe(NO_VALUE);
  });
});
