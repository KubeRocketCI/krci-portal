import type { ScanFinding, ScanFindings } from "@my-project/shared";
import { describe, expect, it } from "vitest";
import { NO_VALUE } from "./constants";
import { environmentLabel, findingsFailed, formatFix, formatLocation, formatScanTime, getFindingStates } from "./utils";

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
    ).toEqual(["False positive", "Out of scope", "Risk accepted", "Under review"]);
  });

  it("names a fixed finding Mitigated, not a false positive or out of scope one that DefectDojo marks mitigated too", () => {
    expect(getFindingStates(finding({ active: false, mitigated: true }))).toEqual(["Mitigated"]);
    expect(getFindingStates(finding({ active: false, mitigated: true, falsePositive: true }))).toEqual([
      "False positive",
    ]);
    expect(getFindingStates(finding({ active: false, mitigated: true, outOfScope: true }))).toEqual(["Out of scope"]);
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

const PAGE: ScanFindings = { state: "data", total: 0, findings: [] };

describe("findingsFailed", () => {
  it("is true when the request failed and no page is on screen", () => {
    expect(findingsFailed({ data: undefined, isError: true })).toBe(true);
  });

  it("is false while the first page is still loading", () => {
    expect(findingsFailed({ data: undefined, isError: false })).toBe(false);
  });

  it.each<[string, ScanFindings]>([
    ["unreachable", { state: "unreachable" }],
    ["notConfigured", { state: "notConfigured" }],
  ])("is true when DefectDojo answered %s, whether or not the request failed", (_, data) => {
    expect(findingsFailed({ data, isError: false })).toBe(true);
    expect(findingsFailed({ data, isError: true })).toBe(true);
  });

  it.each<[string, ScanFindings]>([
    ["a page", PAGE],
    ["no scan data", { state: "noScanData" }],
  ])("is false when DefectDojo answered with %s", (_, data) => {
    expect(findingsFailed({ data, isError: false })).toBe(false);
  });

  it("is false when a refetch failed while a page is on screen: the page stays", () => {
    expect(findingsFailed({ data: PAGE, isError: true })).toBe(false);
  });
});

describe("environmentLabel", () => {
  it("names the Environment by its CDPipeline and its stage", () => {
    expect(environmentLabel({ cdPipeline: "demo", stage: "dev" })).toBe("demo / dev");
  });
});
