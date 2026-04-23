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
const SCA_PAGE_SIZE_MAX = 100;

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
