// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import type {
  PrototypeDefectDojoFinding,
  PrototypeDefectDojoSeverityCounts,
  PrototypeDefectDojoTest,
} from "@my-project/shared";

/** Value of the tag `<key>:<value>`, or `null` when no tag has that key. */
export function getTagValue(tags: string[], key: string): string | null {
  const prefix = `${key}:`;
  const tag = tags.find((candidate) => candidate.startsWith(prefix));
  return tag ? tag.slice(prefix.length) : null;
}

/** A Runtime test with an empty `buildId` is closed: its workload or namespace is gone. It has no counts. */
export function isTestNotRunning(test: PrototypeDefectDojoTest): boolean {
  return test.level === "runtime" && test.buildId === "";
}

/** "Fix available", with the version when the scanner reports one. */
export function formatFix(finding: PrototypeDefectDojoFinding): string {
  if (finding.fixVersion) return `Fix available: ${finding.fixVersion}`;
  if (finding.fixAvailable === true) return "Fix available";
  if (finding.fixAvailable === false) return "No fix";
  return "—";
}

/**
 * Sum of counts of one scan type over different targets. Counts of two scanners of the same target
 * are never added: both report the same vulnerabilities.
 * `null` when any item is `null` or the list is empty: a missing count never reads as zero.
 */
export function sumSeverityCounts(
  list: (PrototypeDefectDojoSeverityCounts | null)[]
): PrototypeDefectDojoSeverityCounts | null {
  if (list.length === 0) {
    return null;
  }

  const sum: PrototypeDefectDojoSeverityCounts = { critical: 0, high: 0, medium: 0, low: 0, info: 0, total: 0 };
  for (const counts of list) {
    if (!counts) {
      return null;
    }
    sum.critical += counts.critical;
    sum.high += counts.high;
    sum.medium += counts.medium;
    sum.low += counts.low;
    sum.info += counts.info;
    sum.total += counts.total;
  }
  return sum;
}

export function formatScanTime(iso: string | null): string {
  if (!iso) {
    return "—";
  }
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

/** Triage states of a finding, in display order. An active finding with none of them returns an empty list. */
export function getFindingStates(finding: PrototypeDefectDojoFinding): string[] {
  const states: string[] = [];
  if (finding.falsePositive) states.push("False positive");
  if (finding.outOfScope) states.push("Out of scope");
  if (finding.riskAccepted) states.push("Risk accepted");
  if (finding.duplicate) states.push("Duplicate");
  if (finding.mitigated) states.push("Mitigated");
  if (finding.underReview) states.push("Under review");
  return states;
}

/** SEVERITY_BADGE_CLASSES key for a DefectDojo severity. */
export function toSeverityLevel(severity: string): string {
  return severity === "Info" ? "INFO" : severity.toUpperCase();
}
