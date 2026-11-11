import type { SecurityCounts as SecurityCountsData, SecurityEnvironmentOther } from "@my-project/shared";
import { DefectDojoLink } from "@/modules/platform/security/components/defectdojo/DefectDojoLink";
import { FocusableTooltipText } from "@/modules/platform/security/components/defectdojo/FocusableTooltipText";
import { SecurityCounts } from "@/modules/platform/security/components/defectdojo/SecurityCounts";
import type { OtherCodebases } from "@/modules/platform/security/components/defectdojo/utils";

interface SecurityOtherLineProps {
  /** Name of the line; the hint opens on hover and focus of this text. */
  label: string;
  hint: string;
  entries: { name: string; counts: SecurityCountsData }[];
  link: string;
}

const SecurityOtherLine = ({ label, hint, entries, link }: SecurityOtherLineProps) => (
  <div className="border-border text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 border-t px-4 py-3 text-sm">
    {entries.map(({ name, counts }, index) => (
      <div key={name} className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span>
          {index === 0 && (
            <>
              <FocusableTooltipText hint={hint}>{label}</FocusableTooltipText>
              {": "}
            </>
          )}
          <span className="text-foreground font-mono text-xs">{name}</span>
        </span>
        <SecurityCounts counts={counts} />
      </div>
    ))}
    <DefectDojoLink href={link} label="Open runtime findings in DefectDojo" />
  </div>
);

export interface SecurityOtherLinesProps {
  /** Codebases that run in the environment without being rows of the stage table. */
  codebases?: OtherCodebases;
  /** Workloads whose images belong to no codebase. */
  workloads?: SecurityEnvironmentOther;
}

/** Findings of the environment's entries that are not rows of the stage table; a line shows only when it has entries. */
export const SecurityOtherLines = ({ codebases, workloads }: SecurityOtherLinesProps) => (
  <>
    {codebases && (
      <SecurityOtherLine
        label="Other codebases"
        hint="Codebases whose images run in this environment but are not applications of this deployment"
        entries={codebases.entries.map(({ codebase, counts }) => ({ name: codebase, counts }))}
        link={codebases.link}
      />
    )}
    {workloads && workloads.workloads.length > 0 && (
      <SecurityOtherLine
        label="Other workloads"
        hint="Workloads whose images belong to no codebase"
        entries={[{ name: workloads.workloads.join(", "), counts: workloads.counts }]}
        link={workloads.link}
      />
    )}
  </>
);
