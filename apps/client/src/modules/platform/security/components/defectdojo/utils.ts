import type { ScanFinding } from "@my-project/shared";
import { NO_VALUE } from "./constants";

/** "Fix available", with the version where the scanner fills it. */
export function formatFix(finding: Pick<ScanFinding, "fixAvailable" | "fixVersion">): string {
  if (finding.fixVersion) {
    return `Fix available: ${finding.fixVersion}`;
  }
  if (finding.fixAvailable === true) {
    return "Fix available";
  }
  if (finding.fixAvailable === false) {
    return "No fix";
  }
  return NO_VALUE;
}

/** Triage states of a finding, in display order. Empty when no flag is set. */
export function getFindingStates(
  finding: Pick<ScanFinding, "falsePositive" | "outOfScope" | "riskAccepted" | "mitigated" | "underReview">
): string[] {
  const states: string[] = [];
  if (finding.falsePositive) states.push("False positive");
  if (finding.outOfScope) states.push("Out of scope");
  if (finding.riskAccepted) states.push("Risk accepted");
  if (finding.mitigated) states.push("Mitigated");
  if (finding.underReview) states.push("Under review");
  return states;
}

/** The file of a finding with its line, where the scanner gives them. */
export function formatLocation(finding: Pick<ScanFinding, "filePath" | "line">): string {
  if (!finding.filePath) {
    return NO_VALUE;
  }
  return finding.line ? `${finding.filePath}:${finding.line}` : finding.filePath;
}

/** Date and time of an upload in the browser's locale. */
export function formatScanTime(iso: string | null): string {
  if (!iso) {
    return NO_VALUE;
  }
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? NO_VALUE
    : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
