import type {
  SecurityCounts,
  SecurityCiSummary,
  SecurityEnvironmentApplication,
  SecurityEnvironmentSummary,
  SecuritySeverity,
} from "@my-project/shared";
import type { RequestError } from "@/core/types/global";

export const SEVERITY_ROWS: ReadonlyArray<{ key: SecuritySeverity; label: string }> = [
  { key: "critical", label: "Critical" },
  { key: "high", label: "High" },
  { key: "medium", label: "Medium" },
  { key: "low", label: "Low" },
  { key: "unassigned", label: "Unassigned" },
];

const COUNT_COMPACT_THRESHOLD = 10_000;

const compactNumberFormat = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

/** Full number below 10,000 (`9,999`); compact from 10,000 (`12.4K`, `1.2M`). The exact value belongs in a title or tooltip. */
export const formatCount = (count: number): string =>
  count < COUNT_COMPACT_THRESHOLD ? count.toLocaleString("en") : compactNumberFormat.format(count);

export const getTotalCount = (counts: SecurityCounts): number =>
  SEVERITY_ROWS.reduce((total, { key }) => total + counts[key], 0);

/**
 * Most severe first: critical, high, medium, low, unassigned (descending), then the name.
 * Entries without findings sort last. Returns a new array.
 */
export const sortEntriesBySeverity = <T extends { counts: SecurityCounts }>(
  entries: readonly T[],
  getName: (entry: T) => string
): T[] =>
  [...entries].sort((a, b) => {
    for (const { key } of SEVERITY_ROWS) {
      if (a.counts[key] !== b.counts[key]) {
        return b.counts[key] - a.counts[key];
      }
    }
    return getName(a).localeCompare(getName(b));
  });

export const FOCUS_RING_CLASS = "focus-visible:ring-ring rounded-sm focus-visible:ring-2 focus-visible:outline-none";

export const ICON_LINK_CLASS = `text-muted-foreground hover:text-foreground ${FOCUS_RING_CLASS}`;

/** Splits a runtime entry's `<cdPipeline>/<stage>` into the route params of the Stage page. */
export const parseEnvironment = (environment: string): { cdPipeline: string; stage: string } | undefined => {
  const [cdPipeline, stage, ...rest] = environment.split("/");
  return cdPipeline && stage && rest.length === 0 ? { cdPipeline, stage } : undefined;
};

export const getCiEntryLabel = (entry: SecurityCiSummary): string => {
  if (entry.kind === "code") {
    return entry.branch ? `Code scan: ${entry.branch}` : "Code scan";
  }

  const image = entry.image ?? entry.engagement;
  const reference = entry.tag ? `${image}:${entry.tag}` : image;
  return `Image scan: ${reference}`;
};

export const findEnvironmentApplication = (
  summary: SecurityEnvironmentSummary | undefined,
  codebase: string
): SecurityEnvironmentApplication | undefined => summary?.applications.find((app) => app.codebase === codebase);

export interface OtherCodebases {
  entries: SecurityEnvironmentApplication[];
  link: string;
}

/**
 * Codebases whose image runs in the environment and that are not in `applicationNames`; undefined when there are none.
 * Every application of one environment carries the same environment link, so the first one stands for all.
 * The counts of two codebases can include the same finding when they share an image.
 */
export const getOtherCodebases = (
  summary: SecurityEnvironmentSummary | undefined,
  applicationNames: readonly string[]
): OtherCodebases | undefined => {
  const applicationNameSet = new Set(applicationNames);
  const entries = summary?.applications.filter((app) => !applicationNameSet.has(app.codebase)) ?? [];

  return entries.length > 0 ? { entries, link: entries[0].link } : undefined;
};

const getHttpStatus = (error: Error | null): number | undefined => (error as RequestError | null)?.data?.httpStatus;

/** Kubernetes RBAC denials (403) and missing resources (404) do not change on retry. */
export const isNonRetryableRequestError = (error: Error | null): boolean => {
  const httpStatus = getHttpStatus(error);
  return httpStatus === 403 || httpStatus === 404;
};

/** Query options shared by the security summary hooks. */
export const SECURITY_SUMMARY_QUERY_OPTIONS = {
  staleTime: 60 * 1000,
  retry: (failureCount: number, error: Error | null) => !isNonRetryableRequestError(error) && failureCount < 1,
};

export const getSecurityErrorMessage = (error: Error | null): string => {
  switch (getHttpStatus(error)) {
    case 403:
      return "You don't have permissions to view the security findings of this resource.";
    case 404:
      return "The requested resource was not found.";
    default:
      return error?.message ?? "Failed to load security findings.";
  }
};
