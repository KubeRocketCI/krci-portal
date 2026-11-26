import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";

/** One part of the overview: a procedure, and the cards, lists and tab that show its answer. */
export interface Part {
  /** "Runtime findings", "Code and Image findings". */
  what: string;
  /** `null`: the part is not asked for, and its places say `unaskedNote`. */
  query: Pick<UseQueryResult<{ state: string }>, "data" | "isPending" | "error" | "isFetching" | "refetch"> | null;
  unaskedNote?: string;
  /** What its places show when DefectDojo holds no scan data for the part. */
  noScanData: ReactNode;
}

export type Failure = { kind: "unreachable" } | { kind: "failed"; message: string };

/** How the part failed: DefectDojo is unreachable, or the request failed. `null` while it loads, and once it answers. */
export function failureOf({ query }: Part): Failure | null {
  if (query === null || query.isPending) {
    return null;
  }
  if (query.data === undefined) {
    return { kind: "failed", message: query.error?.message ?? "Unknown error" };
  }
  return query.data.state === "unreachable" ? { kind: "unreachable" } : null;
}

/** The places of the part show a placeholder, not its data: not asked for, loading, failed, or no scan data. */
export function showsPlaceholder(part: Part): boolean {
  return part.query?.data?.state !== "data";
}

/** Failed parts by how they failed: parts that failed alike share one alert. */
export function groupFailures(parts: readonly Part[]): { failure: Failure; failed: Part[] }[] {
  const groups = new Map<string, { failure: Failure; failed: Part[] }>();
  for (const part of parts) {
    const failure = failureOf(part);
    if (failure) {
      const key = failure.kind === "failed" ? `failed\n${failure.message}` : failure.kind;
      const group = groups.get(key) ?? { failure, failed: [] };
      group.failed.push(part);
      groups.set(key, group);
    }
  }
  return [...groups.values()];
}
