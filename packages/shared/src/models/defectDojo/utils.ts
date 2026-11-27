import {
  CODEBASE_SCAN_LEVELS,
  DEFECTDOJO_SEVERITIES,
  NO_FINDING_COUNTS,
  RUNTIME_FINDING_STATES,
  type CodebaseScanLevel,
  type DefectDojoFindingState,
  type DefectDojoLevel,
  type DefectDojoSeverity,
  type SeverityCounts,
  type RuntimeReportKind,
  type RuntimeState,
} from "./constants.js";
import type {
  CodebaseScanRef,
  EnvironmentContainer,
  OverviewNamespace,
  RunningEnvironmentContainer,
  RuntimeContainer,
  RuntimeContainerRef,
  RuntimeEnvironment,
} from "./types.js";

/** Identity of a scan as one string: equal for the same scan, different for any other. Not a lookup key sent to DefectDojo. */
export function scanRefKey(scan: CodebaseScanRef): string {
  return JSON.stringify([scan.level, scan.branch, scan.scanner, scan.image]);
}

/** The typed identity of one report of a container row, as `getScanFindings` takes it. */
export function runtimeContainerRef(
  environment: Pick<RuntimeEnvironment, "cdPipeline" | "stage">,
  container: Pick<RuntimeContainer, "workload" | "container">,
  reportKind: RuntimeReportKind
): RuntimeContainerRef {
  return {
    level: "runtime",
    cdPipeline: environment.cdPipeline,
    stage: environment.stage,
    workload: container.workload,
    container: container.container,
    reportKind,
  };
}

/**
 * Identity of a container row as one string: both report kinds of a container share it. It starts with `runtime`, which
 * is no level of a scan, so it never equals a `scanRefKey`.
 */
export function runtimeContainerKey(
  environment: Pick<RuntimeEnvironment, "cdPipeline" | "stage">,
  container: Pick<RuntimeContainer, "workload" | "container">
): string {
  return JSON.stringify([
    "runtime",
    environment.cdPipeline,
    environment.stage,
    container.workload,
    container.container,
  ]);
}

export function hasActiveFindings(counts: Readonly<SeverityCounts>): boolean {
  return DEFECTDOJO_SEVERITIES.some((severity) => counts[severity] > 0);
}

export function sumCounts(list: readonly Readonly<SeverityCounts>[]): SeverityCounts {
  const sum = { ...NO_FINDING_COUNTS };
  for (const counts of list) {
    for (const severity of DEFECTDOJO_SEVERITIES) {
      sum[severity] += counts[severity];
    }
  }
  return sum;
}

export function totalOf(counts: Readonly<SeverityCounts>): number {
  return DEFECTDOJO_SEVERITIES.reduce((total, severity) => total + counts[severity], 0);
}

/**
 * Orders counts most severe first: more Critical, then more High, then more findings; `first` ranks one severity
 * before that. No counts (`null`) come last.
 */
export function mostSevereFirst(first?: DefectDojoSeverity) {
  return (a: Readonly<SeverityCounts> | null, b: Readonly<SeverityCounts> | null): number => {
    if (a === null || b === null) {
      return Number(a === null) - Number(b === null);
    }
    return (first ? b[first] - a[first] : 0) || b.Critical - a.Critical || b.High - a.High || totalOf(b) - totalOf(a);
  };
}

export function runtimeStateOf({
  containers,
  running,
  hasFindings,
}: {
  containers: number;
  running: number;
  /** A running container holds an active finding or secret. */
  hasFindings: boolean;
}): RuntimeState {
  if (containers === 0) {
    return "noScanData";
  }
  if (running === 0) {
    return "notRunning";
  }
  return hasFindings ? "data" : "clean";
}

export function hasActiveEnvironmentFindings({ vulnerabilities, secrets }: RunningEnvironmentContainer): boolean {
  return (vulnerabilities !== null && hasActiveFindings(vulnerabilities)) || (secrets ?? 0) > 0;
}

export function isRunningEnvironmentContainer(
  container: EnvironmentContainer
): container is RunningEnvironmentContainer {
  return container.state === "running";
}

/**
 * Orders counts by their most severe finding: more of the highest severity first, then of the next one, so one Medium
 * outranks any number of Low; `first` ranks one severity before that. `mostSevereFirst` ranks by Critical, High,
 * then the totals.
 */
export function mostSevereFindingFirst(first?: DefectDojoSeverity) {
  const order = first ? [first, ...DEFECTDOJO_SEVERITIES] : DEFECTDOJO_SEVERITIES;
  return (a: Readonly<SeverityCounts>, b: Readonly<SeverityCounts>): number => {
    for (const severity of order) {
      if (a[severity] !== b[severity]) {
        return b[severity] - a[severity];
      }
    }
    return 0;
  };
}

/** The item whose counts come first by `mostSevereFindingFirst`; of equal counts the first. `undefined`: none. */
export function mostSevereScan<T extends { counts: Readonly<SeverityCounts> }>(
  items: readonly T[],
  first?: DefectDojoSeverity
): T | undefined {
  const compare = mostSevereFindingFirst(first);
  return items.reduce<T | undefined>(
    (worst, item) => (worst === undefined || compare(item.counts, worst.counts) < 0 ? item : worst),
    undefined
  );
}

export function hasActiveRuntimeFindings({
  vulnerabilities,
  secrets,
}: Pick<Extract<RuntimeContainer, { state: "running" }>, "vulnerabilities" | "secrets">): boolean {
  return (
    (vulnerabilities !== null && hasActiveFindings(vulnerabilities.counts)) || (secrets !== null && secrets.active > 0)
  );
}

export function isCodebaseScanLevel(level: DefectDojoLevel | null): level is CodebaseScanLevel {
  return (CODEBASE_SCAN_LEVELS as readonly (DefectDojoLevel | null)[]).includes(level);
}

export function isRuntimeFindingState(state: DefectDojoFindingState): state is (typeof RUNTIME_FINDING_STATES)[number] {
  return (RUNTIME_FINDING_STATES as readonly DefectDojoFindingState[]).includes(state);
}

/** A filter beyond the scope of a list: an empty page then means no match, not no findings. */
export function hasFindingFilter(request: {
  state: DefectDojoFindingState;
  severity?: DefectDojoSeverity;
  vulnerabilityId?: string;
  component?: string;
}): boolean {
  return (
    request.state !== "active" ||
    request.severity !== undefined ||
    request.vulnerabilityId !== undefined ||
    request.component !== undefined
  );
}

/** An Environment of the installation, or a namespace it manages: the first group of a cluster on the overview. */
export function isOwnNamespace(row: Pick<OverviewNamespace, "environment" | "managed">): boolean {
  return row.environment !== null || row.managed;
}

/**
 * Orders namespaces by their findings, most severe first: a namespace ranks by the more severe of its vulnerabilities and
 * its exposed secrets, which are never added, then by the other; `first` ranks one severity before that. Then by name.
 */
export function compareNamespaceFindings(first?: DefectDojoSeverity) {
  const mostSevere = mostSevereFirst(first);
  const byRank = ({ product }: OverviewNamespace) => {
    const vulnerabilities = product?.vulnerabilities ?? null;
    const secrets = product?.secrets ?? null;
    return mostSevere(vulnerabilities, secrets) <= 0 ? [vulnerabilities, secrets] : [secrets, vulnerabilities];
  };

  return (a: OverviewNamespace, b: OverviewNamespace): number => {
    const [aFirst, aSecond] = byRank(a);
    const [bFirst, bSecond] = byRank(b);
    return mostSevere(aFirst, bFirst) || mostSevere(aSecond, bSecond) || a.namespace.localeCompare(b.namespace);
  };
}

/**
 * The order of the namespaces of the Security overview: by cluster; in each, the own namespaces first, then the others;
 * in each group as `compareNamespaceFindings` orders them.
 */
export function compareOverviewNamespaces(first?: DefectDojoSeverity) {
  const byFindings = compareNamespaceFindings(first);

  return (a: OverviewNamespace, b: OverviewNamespace): number =>
    a.cluster.localeCompare(b.cluster) || Number(!isOwnNamespace(a)) - Number(!isOwnNamespace(b)) || byFindings(a, b);
}
