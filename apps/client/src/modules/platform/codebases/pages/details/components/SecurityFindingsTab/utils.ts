import type { SecurityCiSummary, SecurityCodebaseSummary, SecurityCounts } from "@my-project/shared";
import {
  getCiEntryLabel,
  parseEnvironment,
  SEVERITY_ROWS,
  sortEntriesBySeverity,
} from "@/modules/platform/security/components/defectdojo/utils";

export type FindingsScope = "runtime" | "ci";

/** Entries shown before "Show all" in lists and charts. */
export const COLLAPSED_ENTRY_COUNT = 10;

export const MAX_VERSIONS_SHOWN = 3;

export interface FindingsEntry {
  /** Unique within its list. */
  key: string;
  label: string;
  counts: SecurityCounts;
}

/** A list row: an entry with its DefectDojo link, versions and the stage it belongs to. */
export interface EntryRow extends FindingsEntry {
  link: string;
  versions: string[];
  /** Route params of the Stage page; absent for CI entries and unparsable environments. */
  stage?: { cdPipeline: string; stage: string };
}

export const EMPTY_COUNTS: SecurityCounts = { critical: 0, high: 0, medium: 0, low: 0, unassigned: 0 };

export const sumCounts = (items: ReadonlyArray<{ counts: SecurityCounts }>): SecurityCounts =>
  items.reduce<SecurityCounts>(
    (sum, { counts }) => ({
      critical: sum.critical + counts.critical,
      high: sum.high + counts.high,
      medium: sum.medium + counts.medium,
      low: sum.low + counts.low,
      unassigned: sum.unassigned + counts.unassigned,
    }),
    EMPTY_COUNTS
  );

/** Share of `part` in `total`, 0 to 100. A zero total gives 0. */
export const getPercent = (part: number, total: number): number => (total > 0 ? (part / total) * 100 : 0);

/** `<1%` for a non-zero share below one percent, one decimal below 10%, whole percents above. */
export const formatPercent = (part: number, total: number): string => {
  const percent = getPercent(part, total);
  if (percent === 0) {
    return "0%";
  }
  if (percent < 1) {
    return "<1%";
  }
  return `${percent < 10 ? percent.toFixed(1) : Math.round(percent)}%`;
};

/** Keeps the middle of a long value: the start and the end (tag suffix) identify it. */
export const truncateMiddle = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) {
    return value;
  }
  const keep = Math.max(maxLength - 1, 2);
  const head = Math.ceil(keep / 2);
  const tail = Math.floor(keep / 2);
  return `${value.slice(0, head)}…${value.slice(value.length - tail)}`;
};

export const getCiEntries = (ci: SecurityCiSummary[]): EntryRow[] =>
  sortEntriesBySeverity(
    ci.map((entry) => ({
      key: entry.link,
      label: getCiEntryLabel(entry),
      counts: entry.counts,
      link: entry.link,
      versions: [],
    })),
    (entry) => entry.label
  );

export const getRuntimeEntries = (runtime: SecurityCodebaseSummary["runtime"]): EntryRow[] =>
  sortEntriesBySeverity(
    runtime.map((entry) => ({
      key: entry.link,
      label: entry.environment,
      counts: entry.counts,
      link: entry.link,
      versions: entry.versions,
      stage: parseEnvironment(entry.environment),
    })),
    (entry) => entry.label
  );

export interface LimitedEntries {
  visible: FindingsEntry[];
  /** The rest folded into one entry; absent when everything fits. */
  other?: FindingsEntry;
}

/** The first `limit` entries (already ordered) and the sum of the rest as "Other (N)". */
export const limitEntries = (entries: FindingsEntry[], limit: number = COLLAPSED_ENTRY_COUNT): LimitedEntries => {
  if (entries.length <= limit) {
    return { visible: entries };
  }

  const rest = entries.slice(limit);
  return {
    visible: entries.slice(0, limit),
    other: { key: "other", label: `Other (${rest.length})`, counts: sumCounts(rest) },
  };
};

export const getScopeSummary = (counts: SecurityCounts): string =>
  SEVERITY_ROWS.map(({ key, label }) => `${counts[key].toLocaleString("en")} ${label.toLowerCase()}`).join(", ");

/** Runtime when present, otherwise CI. */
export const getDefaultScope = (summary: SecurityCodebaseSummary): FindingsScope =>
  summary.runtime.length > 0 ? "runtime" : "ci";

/** Latest `updated` timestamp of the summary. */
export const getLastUpdated = (summary: SecurityCodebaseSummary): Date | undefined => {
  const timestamps = [...summary.ci, ...summary.runtime]
    .map((entry) => (entry.updated ? new Date(entry.updated).getTime() : NaN))
    .filter((time) => !Number.isNaN(time));

  return timestamps.length > 0 ? new Date(Math.max(...timestamps)) : undefined;
};
