import { describe, expect, it } from "vitest";
import type { SecurityCodebaseSummary, SecurityCounts } from "@my-project/shared";
import {
  COLLAPSED_ENTRY_COUNT,
  formatPercent,
  getCiEntries,
  getDefaultScope,
  getLastUpdated,
  getPercent,
  getRuntimeEntries,
  limitEntries,
  sumCounts,
  truncateMiddle,
  type FindingsEntry,
} from "./utils";

const counts = (overrides: Partial<SecurityCounts> = {}): SecurityCounts => ({
  critical: 0,
  high: 0,
  medium: 0,
  low: 0,
  unassigned: 0,
  ...overrides,
});

const entry = (index: number, overrides: Partial<SecurityCounts> = {}): FindingsEntry => ({
  key: `entry-${index}`,
  label: `entry-${index}`,
  counts: counts(overrides),
});

describe("sumCounts", () => {
  it("sums every severity", () => {
    const items = [{ counts: counts({ critical: 1, low: 2 }) }, { counts: counts({ critical: 3, high: 4 }) }];

    expect(sumCounts(items)).toEqual(counts({ critical: 4, high: 4, low: 2 }));
  });

  it("returns zero counts for no items", () => {
    expect(sumCounts([])).toEqual(counts());
  });
});

describe("getPercent", () => {
  it("returns the share of the total", () => {
    expect(getPercent(1, 4)).toBe(25);
  });

  it("returns 0 for a zero total", () => {
    expect(getPercent(0, 0)).toBe(0);
    expect(getPercent(5, 0)).toBe(0);
  });
});

describe("formatPercent", () => {
  it("formats shares", () => {
    expect(formatPercent(0, 100)).toBe("0%");
    expect(formatPercent(1, 1000)).toBe("<1%");
    expect(formatPercent(25, 1000)).toBe("2.5%");
    expect(formatPercent(1, 3)).toBe("33%");
    expect(formatPercent(5, 5)).toBe("100%");
  });

  it("returns 0% for a zero total", () => {
    expect(formatPercent(0, 0)).toBe("0%");
  });
});

describe("truncateMiddle", () => {
  it("keeps short values", () => {
    expect(truncateMiddle("main-1", 10)).toBe("main-1");
  });

  it("keeps the start and the end of long values within the limit", () => {
    const result = truncateMiddle("release-2026.11.10-build.4821", 15);

    expect(result).toHaveLength(15);
    expect(result.startsWith("release")).toBe(true);
    expect(result.endsWith("4821")).toBe(true);
    expect(result).toContain("…");
  });
});

describe("limitEntries", () => {
  it("returns all entries within the limit", () => {
    const entries = Array.from({ length: COLLAPSED_ENTRY_COUNT }, (_, index) => entry(index));

    expect(limitEntries(entries)).toEqual({ visible: entries });
  });

  it("folds the rest into Other (N) and keeps the sums", () => {
    const entries = Array.from({ length: 34 }, (_, index) => entry(index, { critical: 1, high: index }));

    const { visible, other } = limitEntries(entries);

    expect(visible).toHaveLength(COLLAPSED_ENTRY_COUNT);
    expect(other?.label).toBe("Other (24)");
    expect(sumCounts([...visible, ...(other ? [other] : [])])).toEqual(sumCounts(entries));
  });
});

describe("entries of a summary", () => {
  const summary: SecurityCodebaseSummary = {
    status: "OK",
    codebase: "app",
    ci: [
      {
        kind: "code",
        engagement: "code-main",
        branch: "main",
        tools: [],
        counts: counts(),
        updated: "2026-11-10T10:00:00Z",
        link: "https://dd.example.com/e/1",
      },
      {
        kind: "image",
        engagement: "image:api",
        image: "api",
        tag: "1.0",
        tools: [],
        counts: counts({ high: 2 }),
        updated: "2026-11-10T12:00:00Z",
        link: "https://dd.example.com/e/2",
      },
    ],
    runtime: [
      {
        environment: "demo/dev",
        workloads: [],
        versions: ["v1"],
        tools: [],
        counts: counts({ critical: 1 }),
        updated: "2026-11-11T09:00:00Z",
        link: "https://dd.example.com/e/3",
      },
      {
        environment: "broken",
        workloads: [],
        versions: [],
        tools: [],
        counts: counts({ high: 9 }),
        link: "https://dd.example.com/e/4",
      },
    ],
  };

  it("sorts CI entries by severity and labels them", () => {
    expect(getCiEntries(summary.ci).map((item) => item.label)).toEqual(["Image scan: api:1.0", "Code scan: main"]);
  });

  it("sorts runtime entries by severity and parses the stage", () => {
    const entries = getRuntimeEntries(summary.runtime);

    expect(entries.map((item) => item.label)).toEqual(["demo/dev", "broken"]);
    expect(entries[0].stage).toEqual({ cdPipeline: "demo", stage: "dev" });
    expect(entries[1].stage).toBeUndefined();
  });

  it("defaults to Runtime when present, otherwise CI", () => {
    expect(getDefaultScope(summary)).toBe("runtime");
    expect(getDefaultScope({ ...summary, runtime: [] })).toBe("ci");
  });

  it("finds the latest update", () => {
    expect(getLastUpdated(summary)?.toISOString()).toBe("2026-11-11T09:00:00.000Z");
    expect(getLastUpdated({ ...summary, ci: [], runtime: [] })).toBeUndefined();
  });
});
