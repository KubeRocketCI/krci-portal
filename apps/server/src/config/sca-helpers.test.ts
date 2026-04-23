import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";

import {
  classifyBranchResolution,
  clampPageSize,
  isScaNotConfiguredError,
  latestMetricsSnapshot,
  parseBoolQuery,
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
