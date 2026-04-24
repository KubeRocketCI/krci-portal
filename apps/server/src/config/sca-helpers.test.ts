import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";

import {
  classifyBranchResolution,
  clampPageSize,
  componentMatchesSeverity,
  fetchAllComponents,
  isScaNotConfiguredError,
  latestMetricsSnapshot,
  paginate,
  parseBoolQuery,
  parseSeverityCsv,
  SCA_FINDINGS_MAX,
  sortFindings,
  toZeroIndexedPage,
  truncateFindings,
} from "./sca-helpers.js";

describe("sortFindings", () => {
  it("sorts severity desc then component name asc then vulnId asc", () => {
    const input = [
      {
        component: { name: "c" },
        vulnerability: { severity: "MEDIUM", vulnId: "CVE-1" },
      },
      {
        component: { name: "a" },
        vulnerability: { severity: "CRITICAL", vulnId: "CVE-2" },
      },
      {
        component: { name: "a" },
        vulnerability: { severity: "CRITICAL", vulnId: "CVE-1" },
      },
      {
        component: { name: "b" },
        vulnerability: { severity: "UNASSIGNED", vulnId: "CVE-1" },
      },
    ];
    const sorted = sortFindings(input);
    expect(
      sorted.map(
        (f) =>
          `${f.vulnerability.severity}|${f.component.name}|${f.vulnerability.vulnId}`
      )
    ).toEqual([
      "CRITICAL|a|CVE-1",
      "CRITICAL|a|CVE-2",
      "MEDIUM|c|CVE-1",
      "UNASSIGNED|b|CVE-1",
    ]);
  });

  it("treats unknown severities as lowest rank", () => {
    const input = [
      {
        component: { name: "a" },
        vulnerability: { severity: "WEIRD", vulnId: "X" },
      },
      {
        component: { name: "a" },
        vulnerability: { severity: "LOW", vulnId: "X" },
      },
    ];
    expect(sortFindings(input)[0]?.vulnerability.severity).toBe("LOW");
  });

  it("does not mutate its input", () => {
    const input = [
      {
        component: { name: "c" },
        vulnerability: { severity: "LOW", vulnId: "Z" },
      },
      {
        component: { name: "a" },
        vulnerability: { severity: "HIGH", vulnId: "A" },
      },
    ];
    const snapshot = JSON.stringify(input);
    sortFindings(input);
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});

describe("truncateFindings", () => {
  it("passes through when under the cap", () => {
    const small = Array.from({ length: 10 }, (_, i) => ({ id: i }));
    const { items, truncated } = truncateFindings(small);
    expect(items).toHaveLength(10);
    expect(truncated).toBe(false);
  });

  it("caps at SCA_FINDINGS_MAX and flags truncated", () => {
    const big = Array.from({ length: SCA_FINDINGS_MAX + 1 }, (_, i) => ({
      id: i,
    }));
    const { items, truncated } = truncateFindings(big);
    expect(items).toHaveLength(SCA_FINDINGS_MAX);
    expect(truncated).toBe(true);
  });

  it("keeps the first SCA_FINDINGS_MAX rows (stable slice)", () => {
    const big = Array.from({ length: SCA_FINDINGS_MAX + 5 }, (_, i) => ({
      id: i,
    }));
    const { items } = truncateFindings(big);
    expect(items[0]).toEqual({ id: 0 });
    expect(items[items.length - 1]).toEqual({ id: SCA_FINDINGS_MAX - 1 });
  });
});

describe("toZeroIndexedPage", () => {
  it("passes through undefined", () => {
    expect(toZeroIndexedPage(undefined)).toBeUndefined();
  });

  it("subtracts 1 for positive values", () => {
    expect(toZeroIndexedPage(1)).toBe(0);
    expect(toZeroIndexedPage(3)).toBe(2);
  });

  it("clamps non-positive inputs to 0 (defensive)", () => {
    expect(toZeroIndexedPage(0)).toBe(0);
    expect(toZeroIndexedPage(-5)).toBe(0);
  });
});

describe("clampPageSize", () => {
  it("passes through undefined", () => {
    expect(clampPageSize(undefined)).toBeUndefined();
  });

  it("clamps values above max to max", () => {
    expect(clampPageSize(500)).toBe(100);
  });

  it("leaves values at or below max unchanged", () => {
    expect(clampPageSize(50)).toBe(50);
    expect(clampPageSize(100)).toBe(100);
  });
});

describe("latestMetricsSnapshot", () => {
  it("returns the last element of a non-empty series", () => {
    expect(latestMetricsSnapshot([1, 2, 3])).toBe(3);
  });

  it("returns undefined for empty or missing series", () => {
    expect(latestMetricsSnapshot([])).toBeUndefined();
    expect(latestMetricsSnapshot(undefined)).toBeUndefined();
  });
});

describe("parseBoolQuery", () => {
  it("recognises literal true/false", () => {
    expect(parseBoolQuery("true")).toBe(true);
    expect(parseBoolQuery("false")).toBe(false);
  });

  it("returns undefined for anything else", () => {
    expect(parseBoolQuery(undefined)).toBeUndefined();
    expect(parseBoolQuery("")).toBeUndefined();
    expect(parseBoolQuery("yes")).toBeUndefined();
    expect(parseBoolQuery("1")).toBeUndefined();
  });
});

describe("classifyBranchResolution", () => {
  it("returns the explicit branch verbatim without fetching", async () => {
    let fetched = false;
    const result = await classifyBranchResolution("release/1.0", async () => {
      fetched = true;
      return null;
    });
    expect(result).toEqual({ ok: true, branch: "release/1.0" });
    expect(fetched).toBe(false);
  });

  it("reads spec.defaultBranch when branch is omitted", async () => {
    const result = await classifyBranchResolution(undefined, async () => ({
      spec: { defaultBranch: "develop" },
    }));
    expect(result).toEqual({ ok: true, branch: "develop" });
  });

  it("returns codebase_not_found when fetcher returns null", async () => {
    const result = await classifyBranchResolution(undefined, async () => null);
    expect(result).toEqual({ ok: false, reason: "codebase_not_found" });
  });

  it("returns codebase_not_found on NOT_FOUND TRPCError", async () => {
    const result = await classifyBranchResolution(undefined, async () => {
      throw new TRPCError({ code: "NOT_FOUND", message: "nope" });
    });
    expect(result).toEqual({ ok: false, reason: "codebase_not_found" });
  });

  it("returns default_branch_missing when spec.defaultBranch is empty string", async () => {
    const result = await classifyBranchResolution(undefined, async () => ({
      spec: { defaultBranch: "" },
    }));
    expect(result).toEqual({ ok: false, reason: "default_branch_missing" });
  });

  it("returns default_branch_missing when spec.defaultBranch is missing", async () => {
    const result = await classifyBranchResolution(undefined, async () => ({
      spec: {},
    }));
    expect(result).toEqual({ ok: false, reason: "default_branch_missing" });
  });

  it("returns default_branch_missing when resource has no spec", async () => {
    const result = await classifyBranchResolution(undefined, async () => ({}));
    expect(result).toEqual({ ok: false, reason: "default_branch_missing" });
  });

  it("re-throws non-NOT_FOUND errors", async () => {
    await expect(
      classifyBranchResolution(undefined, async () => {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "upstream exploded",
        });
      })
    ).rejects.toThrow("upstream exploded");
  });
});

describe("isScaNotConfiguredError", () => {
  it("returns true for DEPENDENCY_TRACK_URL cause discriminator", () => {
    const err = new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "DEPENDENCY_TRACK_URL environment variable is not configured",
      cause: { kind: "sca_not_configured", missing: "DEPENDENCY_TRACK_URL" },
    });
    expect(isScaNotConfiguredError(err)).toBe(true);
  });

  it("returns true for DEPENDENCY_TRACK_API_KEY cause discriminator", () => {
    const err = new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message:
        "DEPENDENCY_TRACK_API_KEY environment variable is not configured",
      cause: {
        kind: "sca_not_configured",
        missing: "DEPENDENCY_TRACK_API_KEY",
      },
    });
    expect(isScaNotConfiguredError(err)).toBe(true);
  });

  it("returns false for INTERNAL_SERVER_ERROR without the cause discriminator", () => {
    // An unrelated INTERNAL_SERVER_ERROR must not be classified as 503.
    const err = new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "DEPENDENCY_TRACK_URL environment variable is not configured",
    });
    expect(isScaNotConfiguredError(err)).toBe(false);
  });

  it("returns false when cause.kind differs", () => {
    const err = new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "some other config error",
      cause: { kind: "other_error" },
    });
    expect(isScaNotConfiguredError(err)).toBe(false);
  });

  it("rejects unrelated TRPCErrors", () => {
    const err = new TRPCError({ code: "UNAUTHORIZED", message: "auth" });
    expect(isScaNotConfiguredError(err)).toBe(false);
  });

  it("rejects plain Errors and non-errors", () => {
    expect(
      isScaNotConfiguredError(
        new Error("DEPENDENCY_TRACK_URL is not configured")
      )
    ).toBe(false);
    expect(isScaNotConfiguredError(undefined)).toBe(false);
    expect(isScaNotConfiguredError("boom")).toBe(false);
  });
});

describe("parseSeverityCsv", () => {
  it("returns undefined for empty input", () => {
    expect(parseSeverityCsv(undefined)).toBeUndefined();
    expect(parseSeverityCsv("")).toBeUndefined();
  });

  it("parses a single severity case-insensitively", () => {
    const result = parseSeverityCsv("high");
    expect(result).toBeInstanceOf(Set);
    expect([...(result as Set<string>)]).toEqual(["HIGH"]);
  });

  it("parses a comma-separated list and canonicalises to upper case", () => {
    const result = parseSeverityCsv("Critical,high");
    expect([...(result as Set<string>)].sort()).toEqual(["CRITICAL", "HIGH"]);
  });

  it("trims whitespace and collapses duplicates", () => {
    const result = parseSeverityCsv(" HIGH , high ,critical");
    expect([...(result as Set<string>)].sort()).toEqual(["CRITICAL", "HIGH"]);
  });

  it("returns 'invalid' on any unknown token", () => {
    expect(parseSeverityCsv("high,garbage")).toBe("invalid");
    expect(parseSeverityCsv("weird")).toBe("invalid");
  });

  it("returns undefined when only commas are supplied", () => {
    expect(parseSeverityCsv(",,,")).toBeUndefined();
  });
});

describe("componentMatchesSeverity", () => {
  const component = (
    counts: Partial<{
      critical: number;
      high: number;
      medium: number;
      low: number;
      unassigned: number;
    }>
  ) => ({
    metrics: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      unassigned: 0,
      ...counts,
    },
  });

  it("returns false when the component has no metrics", () => {
    expect(componentMatchesSeverity({}, new Set(["HIGH"]))).toBe(false);
    expect(componentMatchesSeverity({ metrics: null }, new Set(["HIGH"]))).toBe(
      false
    );
  });

  it("matches when the requested severity has a non-zero count", () => {
    expect(
      componentMatchesSeverity(component({ high: 2 }), new Set(["HIGH"]))
    ).toBe(true);
  });

  it("does not match when the requested severity count is zero", () => {
    expect(
      componentMatchesSeverity(
        component({ critical: 0, high: 0, medium: 5 }),
        new Set(["HIGH"])
      )
    ).toBe(false);
  });

  it("INFO and UNASSIGNED both consult metrics.unassigned", () => {
    expect(
      componentMatchesSeverity(component({ unassigned: 1 }), new Set(["INFO"]))
    ).toBe(true);
    expect(
      componentMatchesSeverity(
        component({ unassigned: 1 }),
        new Set(["UNASSIGNED"])
      )
    ).toBe(true);
  });

  it("OR semantics across multiple severities", () => {
    expect(
      componentMatchesSeverity(
        component({ critical: 0, high: 1 }),
        new Set(["CRITICAL", "HIGH"])
      )
    ).toBe(true);
    expect(
      componentMatchesSeverity(
        component({ critical: 0, high: 0, medium: 0, low: 0, unassigned: 0 }),
        new Set(["CRITICAL", "HIGH"])
      )
    ).toBe(false);
  });
});

describe("fetchAllComponents", () => {
  /** Build a fetchPage stub that returns pre-defined pages in order. */
  function makePageFetcher<T>(
    pages: Array<{ components: T[]; totalCount: number }>
  ) {
    let call = 0;
    return async () => {
      const page = pages[call++];
      if (!page) return { components: [] as T[], totalCount: 0 };
      return { components: page.components, totalCount: page.totalCount };
    };
  }

  it("natural exhaustion after the first page — truncated: false", async () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const result = await fetchAllComponents(
      makePageFetcher([{ components: items, totalCount: 3 }])
    );
    expect(result.items).toEqual(items);
    expect(result.truncated).toBe(false);
  });

  it("multi-page exhaustion (3 pages, 250 total) — all collected, truncated: false", async () => {
    const page0 = Array.from({ length: 100 }, (_, i) => ({ id: i }));
    const page1 = Array.from({ length: 100 }, (_, i) => ({ id: 100 + i }));
    const page2 = Array.from({ length: 50 }, (_, i) => ({ id: 200 + i }));
    const result = await fetchAllComponents(
      makePageFetcher([
        { components: page0, totalCount: 250 },
        { components: page1, totalCount: 250 },
        { components: page2, totalCount: 250 },
      ])
    );
    expect(result.items).toHaveLength(250);
    expect(result.truncated).toBe(false);
  });

  it("safety-cap trigger — first maxPages pages collected, truncated: true", async () => {
    // Each page returns 100 items but totalCount says 10_000.
    const onePage = Array.from({ length: 100 }, (_, i) => ({ id: i }));
    const pages = Array.from({ length: 5 }, () => ({
      components: onePage,
      totalCount: 10_000,
    }));
    const result = await fetchAllComponents(makePageFetcher(pages), {
      maxPages: 3,
    });
    expect(result.items).toHaveLength(300);
    expect(result.truncated).toBe(true);
  });

  it("empty first page — items: [], truncated: false", async () => {
    const result = await fetchAllComponents(
      makePageFetcher([{ components: [], totalCount: 0 }])
    );
    expect(result.items).toEqual([]);
    expect(result.truncated).toBe(false);
  });

  it("early-exit when upstream returns an empty batch before totalCount is reached — truncated: false", async () => {
    // Upstream claims 1000 but stops yielding after one page of 50.
    const page0 = Array.from({ length: 50 }, (_, i) => ({ id: i }));
    const result = await fetchAllComponents(
      makePageFetcher([
        { components: page0, totalCount: 1000 },
        { components: [], totalCount: 1000 }, // empty batch = end of stream
      ])
    );
    // We collected 50 rows but totalCount is 1000. However, the empty batch
    // broke the loop before the safety cap — we treat this as NOT truncated
    // because upstream itself stopped yielding.
    expect(result.items).toHaveLength(50);
    expect(result.truncated).toBe(false);
  });
});

describe("fetchAllComponents — signal cancellation", () => {
  it("aborts mid-loop: signal fires after page 2, no further fetchPage calls", async () => {
    const controller = new AbortController();
    let callCount = 0;

    const fetchPage = async (pageNumber: number) => {
      callCount += 1;
      // Fire the abort signal after page index 1 (second call) completes.
      if (pageNumber === 1) {
        controller.abort();
      }
      return {
        components: [{ id: pageNumber }],
        totalCount: 1000, // large enough to keep looping without the signal
      };
    };

    await expect(
      fetchAllComponents(fetchPage, {
        maxPages: 10,
        signal: controller.signal,
      })
    ).rejects.toMatchObject({ name: "AbortError" });

    // Pages 0 and 1 ran. After page 1 aborted the controller, page 2 must NOT be fetched.
    expect(callCount).toBe(2);
  });

  it("aborts before first iteration when signal is already fired", async () => {
    const controller = new AbortController();
    controller.abort();

    let callCount = 0;
    const fetchPage = async () => {
      callCount += 1;
      return { components: [{ id: 1 }], totalCount: 100 };
    };

    await expect(
      fetchAllComponents(fetchPage, { signal: controller.signal })
    ).rejects.toMatchObject({ name: "AbortError" });

    expect(callCount).toBe(0);
  });
});

describe("paginate", () => {
  const items = Array.from({ length: 12 }, (_, i) => i);

  it("slices the first page and reports true total", () => {
    expect(paginate(items, 1, 5)).toEqual({
      items: [0, 1, 2, 3, 4],
      totalCount: 12,
    });
  });

  it("slices a middle page", () => {
    expect(paginate(items, 2, 5)).toEqual({
      items: [5, 6, 7, 8, 9],
      totalCount: 12,
    });
  });

  it("returns a short last page", () => {
    expect(paginate(items, 3, 5)).toEqual({
      items: [10, 11],
      totalCount: 12,
    });
  });

  it("returns an empty slice when page is past the end but preserves totalCount", () => {
    expect(paginate(items, 99, 5)).toEqual({ items: [], totalCount: 12 });
  });

  it("defaults pageSize to 25 when undefined", () => {
    const result = paginate(items, undefined, undefined);
    expect(result.items).toEqual(items);
    expect(result.totalCount).toBe(12);
  });

  it("clamps pageSize to the upstream ceiling (100)", () => {
    const many = Array.from({ length: 150 }, (_, i) => i);
    const result = paginate(many, 1, 500);
    expect(result.items).toHaveLength(100);
    expect(result.totalCount).toBe(150);
  });
});
