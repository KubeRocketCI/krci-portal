import { DEFECTDOJO_SEVERITIES, type DefectDojoSeverity, type RuntimeReportKind } from "./constants.js";
import type {
  CodebaseScanRef,
  RuntimeContainer,
  RuntimeContainerRef,
  RuntimeEnvironment,
  VulnerabilitiesRequest,
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

export function hasActiveFindings(counts: Readonly<Record<DefectDojoSeverity, number>>): boolean {
  return DEFECTDOJO_SEVERITIES.some((severity) => counts[severity] > 0);
}

export function hasActiveRuntimeFindings({
  vulnerabilities,
  secrets,
}: Pick<Extract<RuntimeContainer, { state: "running" }>, "vulnerabilities" | "secrets">): boolean {
  return (
    (vulnerabilities !== null && hasActiveFindings(vulnerabilities.counts)) || (secrets !== null && secrets.active > 0)
  );
}

/** A filter beyond the scope of a list: an empty page then means no match, not no findings. */
export function hasVulnerabilityFilter(
  request: Pick<VulnerabilitiesRequest, "state" | "severity" | "vulnerabilityId" | "component">
): boolean {
  return (
    request.state !== "active" ||
    request.severity !== undefined ||
    request.vulnerabilityId !== undefined ||
    request.component !== undefined
  );
}
