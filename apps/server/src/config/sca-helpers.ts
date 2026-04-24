// Pure helpers for the `/rest/v1/sca/*` routes. Kept in a sibling module so
// they can be unit-tested without spinning up Fastify; the routes in
// `openapi.ts` delegate to these functions.

import { TRPCError } from "@trpc/server";

/** Dep-Track-native severity rank for deterministic sort (HIGH value = more severe). */
const SCA_SEVERITY_RANK: Record<string, number> = {
  CRITICAL: 5,
  HIGH: 4,
  MEDIUM: 3,
  LOW: 2,
  INFO: 1,
  UNASSIGNED: 0,
};

/** Upper bound on the findings response; upstream is unpaginated. */
export const SCA_FINDINGS_MAX = 1000;

/** Upper bound on the components / list pageSize (matches current tRPC procedure ceiling). */
export const SCA_PAGE_SIZE_MAX = 100;

/** Canonical Dep-Track severity values. */
export const SCA_SEVERITIES = [
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW",
  "INFO",
  "UNASSIGNED",
] as const;
export type ScaSeverity = (typeof SCA_SEVERITIES)[number];
export type SeveritySet = ReadonlySet<ScaSeverity>;

/** Cap on auto-paging iterations when the severity filter triggers the full-project scan loop. */
export const SCA_PAGE_SIZE_MAX_PAGES = 50;

/**
 * Default page size for the severity-filter pagination path.
 * Mirrors the `pageSize.optional().default(25)` in the `getComponents` tRPC
 * procedure — keeping both in sync prevents the two code paths from silently
 * drifting apart.
 */
export const SCA_DEFAULT_PAGE_SIZE = 25;

/**
 * Sort findings by severity desc, component.name asc, vulnerability.vulnId asc.
 * Pure; operates on a shallow copy of the input.
 */
export function sortFindings<
  T extends {
    vulnerability: { severity: string; vulnId: string };
    component: { name: string };
  },
>(findings: readonly T[]): T[] {
  return [...findings].sort((a, b) => {
    const sa = SCA_SEVERITY_RANK[a.vulnerability.severity] ?? -1;
    const sb = SCA_SEVERITY_RANK[b.vulnerability.severity] ?? -1;
    if (sa !== sb) return sb - sa;

    const na = a.component.name ?? "";
    const nb = b.component.name ?? "";
    if (na !== nb) return na < nb ? -1 : 1;

    const va = a.vulnerability.vulnId ?? "";
    const vb = b.vulnerability.vulnId ?? "";
    return va < vb ? -1 : va > vb ? 1 : 0;
  });
}

/**
 * Cap findings at SCA_FINDINGS_MAX. Returns the (possibly sliced) array and a
 * flag indicating whether truncation occurred.
 */
export function truncateFindings<T>(findings: readonly T[]): {
  items: T[];
  truncated: boolean;
} {
  if (findings.length > SCA_FINDINGS_MAX) {
    return { items: findings.slice(0, SCA_FINDINGS_MAX), truncated: true };
  }
  return { items: findings as T[], truncated: false };
}

/** Translate a CLI 1-indexed page number to the 0-indexed form expected by the tRPC procedure. */
export function toZeroIndexedPage(
  oneIndexed: number | undefined
): number | undefined {
  if (oneIndexed === undefined) return undefined;
  return Math.max(0, oneIndexed - 1);
}

/** Clamp a user-supplied pageSize to the procedure ceiling. */
export function clampPageSize(
  requested: number | undefined,
  max: number = SCA_PAGE_SIZE_MAX
): number | undefined {
  if (requested === undefined) return undefined;
  return Math.min(requested, max);
}

/** Return the latest snapshot from a Dep-Track metrics time series, or undefined when empty. */
export function latestMetricsSnapshot<T>(
  series: readonly T[] | undefined
): T | undefined {
  if (!Array.isArray(series) || series.length === 0) return undefined;
  return series[series.length - 1];
}

/** "true"/"false" query-string values → boolean; any other value → undefined. */
export function parseBoolQuery(raw: string | undefined): boolean | undefined {
  if (raw === "true") return true;
  if (raw === "false") return false;
  return undefined;
}

export type ResolvedBranch =
  | { ok: true; branch: string }
  | { ok: false; reason: "codebase_not_found" | "default_branch_missing" };

/**
 * Classify the branch-resolution outcome given the caller's branch input and
 * the Codebase resource fetch result. Split out from `openapi.ts` so the
 * branch-resolution decision tree can be unit-tested without the K8s layer.
 */
export async function classifyBranchResolution(
  branch: string | undefined,
  fetchResource: () => Promise<{ spec?: unknown } | null>
): Promise<ResolvedBranch> {
  if (branch) {
    return { ok: true, branch };
  }

  let resource: { spec?: unknown } | null;
  try {
    resource = await fetchResource();
  } catch (error) {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") {
      return { ok: false, reason: "codebase_not_found" };
    }
    throw error;
  }

  if (!resource) {
    return { ok: false, reason: "codebase_not_found" };
  }
  const spec = resource.spec as { defaultBranch?: unknown } | null | undefined;
  const defaultBranch = spec?.defaultBranch;
  if (typeof defaultBranch !== "string" || defaultBranch === "") {
    return { ok: false, reason: "default_branch_missing" };
  }
  return { ok: true, branch: defaultBranch };
}

/**
 * Parse a comma-separated severity query string into a canonical set.
 * Case-insensitive; empty / undefined input returns undefined (no filter).
 * Unknown token → "invalid" sentinel so the caller can respond 400.
 */
export function parseSeverityCsv(
  raw: string | undefined
): SeveritySet | "invalid" | undefined {
  if (raw === undefined || raw === "") return undefined;
  const allowed = new Set<string>(SCA_SEVERITIES);
  const out = new Set<ScaSeverity>();
  for (const token of raw.split(",")) {
    const trimmed = token.trim();
    if (trimmed === "") continue;
    const upper = trimmed.toUpperCase();
    if (!allowed.has(upper)) return "invalid";
    out.add(upper as ScaSeverity);
  }
  if (out.size === 0) return undefined;
  return out;
}

/** The metric counter fields this module reads off a DT component. */
export interface VulnerabilityMetrics {
  readonly critical: number;
  readonly high: number;
  readonly medium: number;
  readonly low: number;
  readonly unassigned: number;
}

/**
 * Return true iff the component has at least one vulnerability at a severity
 * present in `allowed`. Components without metrics match nothing.
 *
 * INFO and UNASSIGNED both consult `metrics.unassigned` — Dep-Track folds
 * these together at the rollup level and the CLI's inclusive expansion
 * already sends both when either is requested.
 */
export function componentMatchesSeverity(
  component: { readonly metrics?: VulnerabilityMetrics | null },
  allowed: SeveritySet
): boolean {
  const m = component.metrics;
  if (!m) return false;
  if (allowed.has("CRITICAL") && m.critical > 0) return true;
  if (allowed.has("HIGH") && m.high > 0) return true;
  if (allowed.has("MEDIUM") && m.medium > 0) return true;
  if (allowed.has("LOW") && m.low > 0) return true;
  if ((allowed.has("INFO") || allowed.has("UNASSIGNED")) && m.unassigned > 0)
    return true;
  return false;
}

/**
 * Slice a 1-indexed page out of the given array. Returns the slice and the
 * total row count of the input (caller reports it back as totalCount).
 * Out-of-range page numbers yield an empty slice but still expose the true
 * totalCount so callers can render "page X of Y" accurately.
 */
export function paginate<T>(
  items: readonly T[],
  pageNumber: number | undefined,
  pageSize: number | undefined
): { items: T[]; totalCount: number } {
  const size = clampPageSize(pageSize) ?? SCA_DEFAULT_PAGE_SIZE;
  const page = pageNumber === undefined ? 1 : Math.max(1, pageNumber);
  const start = (page - 1) * size;
  if (start >= items.length) {
    return { items: [], totalCount: items.length };
  }
  return {
    items: items.slice(start, start + size),
    totalCount: items.length,
  };
}

/**
 * Matches the "Dep-Track env var X is not configured" TRPCError emitted by
 * `createDependencyTrackClient()`. Used by the REST handlers to translate that
 * specific INTERNAL_SERVER_ERROR into HTTP 503 Service Unavailable.
 *
 * Detection strategy: check the typed `cause.kind` discriminator attached to
 * the error at throw-site. The regex fallback is intentionally removed — it was
 * fragile and tied to message text. Any older callers that relied on the regex
 * now use the same structured cause path since both throw-sites were updated.
 */
export function isScaNotConfiguredError(error: unknown): boolean {
  if (!(error instanceof TRPCError)) return false;
  if (error.code !== "INTERNAL_SERVER_ERROR") return false;
  const cause = error.cause as Record<string, unknown> | null | undefined;
  return cause?.kind === "sca_not_configured";
}

/**
 * The shape of a single upstream page response for components. Generic so this
 * module stays free of any Fastify / caller dependency — the caller injects the
 * concrete upstream function via `fetchPage`.
 */
export interface ComponentFetchPage<T> {
  components: readonly T[];
  totalCount: number;
}

/**
 * Fetch every component from an upstream paginated source, collecting all pages
 * into a flat array. Stops when:
 *   a) the collected length reaches `totalCount` reported by upstream, or
 *   b) an upstream page returns an empty batch (upstream has stopped yielding), or
 *   c) `maxPages` iterations are exhausted (safety cap), or
 *   d) the optional `signal` fires (client disconnect / Fastify requestTimeout).
 *
 * Returns `{ items, truncated }` where `truncated` is `true` iff the loop
 * exited via the safety cap while more data was still reported upstream.
 * When `signal` fires mid-loop the in-flight `fetchPage` promise will reject
 * (propagated naturally to the caller); no additional items are collected.
 *
 * @param fetchPage  Async function that fetches one page given (pageNumber, pageSize).
 *                   `pageNumber` is 0-indexed.
 * @param opts.maxPages           Safety cap on iterations (default: SCA_PAGE_SIZE_MAX_PAGES).
 * @param opts.upstreamPageSize   Items per upstream request (default: SCA_PAGE_SIZE_MAX).
 * @param opts.signal             Optional AbortSignal; loop exits immediately when aborted.
 */
export async function fetchAllComponents<T>(
  fetchPage: (
    pageNumber: number,
    pageSize: number
  ) => Promise<ComponentFetchPage<T>>,
  opts?: { maxPages?: number; upstreamPageSize?: number; signal?: AbortSignal }
): Promise<{ items: T[]; truncated: boolean }> {
  const maxPages = opts?.maxPages ?? SCA_PAGE_SIZE_MAX_PAGES;
  const upstreamPageSize = opts?.upstreamPageSize ?? SCA_PAGE_SIZE_MAX;
  const signal = opts?.signal;

  const out: T[] = [];
  let total: number = Number.POSITIVE_INFINITY;
  // Tracks whether the loop exited via safety cap (true) vs. natural completion
  // (batch exhausted or totalCount reached). An empty batch from upstream is
  // treated as authoritative end-of-stream even if totalCount says otherwise.
  let hitSafetyCap = false;

  for (let page = 0; page < maxPages; page += 1) {
    // Honour caller-supplied cancellation before issuing each upstream request.
    // If the signal already fired before the loop started this exits immediately.
    if (signal?.aborted) {
      throw new DOMException("fetchAllComponents aborted", "AbortError");
    }

    const res = await fetchPage(page, upstreamPageSize);
    const batch = res.components;
    // Empty batch = upstream has stopped yielding; treat as end-of-stream.
    if (batch.length === 0) break;
    out.push(...batch);
    total = res.totalCount;
    if (out.length >= total) break;
    // If this was the last allowed iteration and we haven't finished, flag it.
    if (page === maxPages - 1 && out.length < total) {
      hitSafetyCap = true;
    }
  }

  return { items: out, truncated: hitSafetyCap };
}
