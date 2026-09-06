import type { DonutSlice } from "@/core/components/charts/DonutChart";
import type { RequestError } from "@/core/types/global";
import { CHART_STATUS_COLOR } from "@/k8s/constants/colors";

/** Loaded bucket counts. */
export interface ResourceHealthCounts {
  ok: number;
  error: number;
  inProgress: number;
  unknown: number;
  cancelled: number;
}

export type LoadedResourceHealth = ResourceHealthCounts & { total: number };

/** `total: null` means not loaded. Never coerce it to 0. */
export type ResourceHealthData = { total: null } | LoadedResourceHealth;

export const RESOURCE_HEALTH_LOADING: ResourceHealthData = { total: null };

// Slice order, labels and colours. alwaysCounted buckets print under a tile even at zero.
const SEGMENTS = [
  { key: "ok", name: "Ok", color: CHART_STATUS_COLOR.SUCCESS, alwaysCounted: true },
  { key: "inProgress", name: "In Progress", color: CHART_STATUS_COLOR.IN_PROGRESS, alwaysCounted: false },
  { key: "error", name: "Failed", color: CHART_STATUS_COLOR.ERROR, alwaysCounted: true },
  { key: "cancelled", name: "Cancelled", color: CHART_STATUS_COLOR.CANCELLED, alwaysCounted: false },
  { key: "unknown", name: "Unknown", color: CHART_STATUS_COLOR.UNKNOWN, alwaysCounted: false },
] as const satisfies readonly {
  key: keyof ResourceHealthCounts;
  name: string;
  color: string;
  alwaysCounted: boolean;
}[];

const toSlice = (counts: ResourceHealthCounts, segment: (typeof SEGMENTS)[number]): DonutSlice => ({
  name: segment.name,
  value: counts[segment.key],
  color: segment.color,
});

/** Ring and tooltip slices. Zero buckets are dropped. */
export function toStatusSlices(counts: ResourceHealthCounts): DonutSlice[] {
  return SEGMENTS.map((segment) => toSlice(counts, segment)).filter((slice) => slice.value > 0);
}

/** Count row under a tile. */
export function toCountRow(counts: ResourceHealthCounts): DonutSlice[] {
  return SEGMENTS.filter((segment) => segment.alwaysCounted || counts[segment.key] > 0).map((segment) =>
    toSlice(counts, segment)
  );
}

export type ResourceTileState =
  | { kind: "error"; error: RequestError }
  | { kind: "loading" }
  | { kind: "ready"; total: number; slices: DonutSlice[]; countRow: DonutSlice[] };

/** Precedence: loaded counts, then error, then loading. A failed refetch keeps the last counts. */
export function toResourceTileState(input: {
  counts: ResourceHealthData;
  error: RequestError | null;
}): ResourceTileState {
  if (input.counts.total !== null) {
    return {
      kind: "ready",
      total: input.counts.total,
      slices: toStatusSlices(input.counts),
      countRow: toCountRow(input.counts),
    };
  }

  if (input.error) {
    return { kind: "error", error: input.error };
  }

  return { kind: "loading" };
}

/** Screen-reader text for a donut. */
export function describeStatusSlices(label: string, total: number, slices: DonutSlice[]): string {
  if (slices.length === 0) {
    return `${label}: ${total} resources. No status segments.`;
  }

  return `${label}: ${total} resources. ${slices.map((slice) => `${slice.value} ${slice.name.toLowerCase()}`).join(", ")}.`;
}
