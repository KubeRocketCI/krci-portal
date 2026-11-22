// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import type { PrototypeDefectDojoFinding } from "@my-project/shared";
import { Badge } from "@/core/components/ui/badge";
import { SeverityBadge } from "@/modules/platform/security/components/shared/SeverityBadge";
import { getFindingStates, toSeverityLevel } from "../utils";

/** Severity of a finding in the colours of the Security pages. */
export function FindingSeverityBadge({ severity }: { severity: PrototypeDefectDojoFinding["severity"] }) {
  // SeverityBadge prints "Unknown" for INFO; the label is passed through for the other four.
  if (severity === "Info") {
    return (
      <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-gray-700 dark:bg-gray-800 dark:text-gray-400">
        Info
      </span>
    );
  }
  return <SeverityBadge severity={toSeverityLevel(severity)} />;
}

/** Triage states of a finding (false positive, out of scope, mitigated and so on). Nothing for a plain active finding. */
export function FindingStateBadges({ finding }: { finding: PrototypeDefectDojoFinding }) {
  const states = getFindingStates(finding);
  if (states.length === 0) {
    return null;
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {states.map((state) => (
        <Badge key={state} variant="neutral">
          {state}
        </Badge>
      ))}
    </span>
  );
}
