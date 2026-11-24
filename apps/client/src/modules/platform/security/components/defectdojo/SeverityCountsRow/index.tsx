import { DEFECTDOJO_SEVERITIES, type DefectDojoSeverity } from "@my-project/shared";
import { SeverityCountBadge } from "../../shared/SeverityCountBadge";

const SEVERITY_INITIAL: Record<DefectDojoSeverity, string> = {
  Critical: "C",
  High: "H",
  Medium: "M",
  Low: "L",
  Info: "I",
};

export interface SeverityCountsRowProps {
  /** Active findings by severity. `null`: there are no counts, shown as dashes and never as zeros. */
  counts: Readonly<Record<DefectDojoSeverity, number>> | null;
  /** What is counted, as the accessible name of the group: "Built image", "Running in demo / dev". */
  label: string;
  /** Why there are no counts, for the accessible name of a dash: "no scan data", "no vulnerability report". */
  missing?: string;
}

export function SeverityCountsRow({ counts, label, missing = "no scan data" }: SeverityCountsRowProps) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {DEFECTDOJO_SEVERITIES.map((severity) => (
        <span key={severity} className="flex items-center gap-1">
          <span className="text-muted-foreground text-xs" aria-hidden>
            {SEVERITY_INITIAL[severity]}
          </span>
          <SeverityCountBadge
            severity={severity}
            count={counts ? counts[severity] : null}
            ariaLabel={`${severity}: ${counts ? counts[severity] : missing}`}
          />
        </span>
      ))}
    </div>
  );
}
