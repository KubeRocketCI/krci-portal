import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { DEFECTDOJO_MAX_PAGE_SIZE, type CodebaseFindingsInput, type ScanRef } from "@my-project/shared";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/core/components/ui/collapsible";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { DefectDojoLink } from "@/modules/platform/security/components/defectdojo/DefectDojoLink";
import { NoFindingsBadge, UnreachableState } from "@/modules/platform/security/components/defectdojo/StateBlocks";
import { SeverityCountsRow } from "@/modules/platform/security/components/defectdojo/SeverityCountsRow";
import { findingsFailed } from "@/modules/platform/security/components/defectdojo/utils";
import { SeverityBadge } from "@/modules/platform/security/components/shared/SeverityBadge";
import { NO_SCAN_DATA_MESSAGE } from "../../constants";
import { useScanFindings } from "../../hooks/useScanFindings";
import { groupByComponent, groupingNote, type ComponentGroup } from "./utils";

function ComponentRow({ group }: { group: ComponentGroup }) {
  const [open, setOpen] = React.useState(false);
  const name = group.version ? `${group.name} ${group.version}` : group.name;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        aria-label={`${open ? "Hide" : "Show"} findings of ${name}`}
        className="hover:bg-input/50 focus-visible:ring-ring flex w-full flex-wrap items-center gap-2 px-2 py-1.5 text-left focus-visible:ring-2 focus-visible:outline-none"
      >
        {open ? (
          <ChevronDown className="size-4 shrink-0" aria-hidden />
        ) : (
          <ChevronRight className="size-4 shrink-0" aria-hidden />
        )}
        <span className="min-w-0 flex-1 text-xs break-all">
          <span className="font-medium">{group.name}</span>
          {group.version && <span className="text-muted-foreground"> {group.version}</span>}
        </span>
        <SeverityCountsRow counts={group.counts} label={`Findings of ${name}`} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="bg-muted/40 space-y-1 px-8 py-2">
          {group.findings.map((finding) => {
            const findingName =
              finding.vulnerabilityIds.length > 0 ? finding.vulnerabilityIds.join(", ") : finding.title;

            return (
              <li key={finding.url} className="flex items-center gap-2 text-xs">
                <SeverityBadge severity={finding.severity} />
                <span className="min-w-0 flex-1 break-all">{findingName}</span>
                <DefectDojoLink href={finding.url} label={`Finding ${findingName}`} />
              </li>
            );
          })}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

export interface ComponentGroupsProps {
  codebase: CodebaseFindingsInput;
  scan: ScanRef;
  /** What is grouped, for accessible names: "Built image", "Running in demo / dev". */
  label: string;
}

/** Mounts, and so reads the findings, only when the group opens. */
function ComponentGroupList({ codebase, scan, label }: ComponentGroupsProps) {
  const query = useScanFindings({
    ...codebase,
    scan,
    showTriaged: false,
    page: 0,
    pageSize: DEFECTDOJO_MAX_PAGE_SIZE,
  });
  const result = query.data;

  if (findingsFailed(query)) {
    return <UnreachableState what="Components" onRetry={() => void query.refetch()} isRetrying={query.isFetching} />;
  }
  if (result === undefined) {
    return (
      <div className="flex justify-center p-4">
        <LoadingSpinner size={20} />
      </div>
    );
  }
  if (result.state === "noScanData") {
    return <p className="text-muted-foreground text-sm">{NO_SCAN_DATA_MESSAGE}</p>;
  }
  if (result.state !== "data") {
    return null;
  }
  if (result.total === 0) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <NoFindingsBadge />
        No active findings.
      </div>
    );
  }

  const note = groupingNote(result.total);
  const groups = groupByComponent(result.findings);

  return (
    <div className="space-y-2">
      <ul aria-label={`Components with findings, ${label}`} className="divide-y rounded border">
        {groups.map((group) => (
          <li key={group.key}>
            <ComponentRow group={group} />
          </li>
        ))}
      </ul>
      {note && <p className="text-muted-foreground text-xs">{note}</p>}
    </div>
  );
}

export function ComponentGroups({ codebase, scan, label }: ComponentGroupsProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="space-y-2">
      <CollapsibleTrigger
        aria-label={`${open ? "Hide" : "Show"} components of ${label}`}
        className="hover:bg-input/50 focus-visible:ring-ring -ml-1 flex items-center gap-1 rounded px-1 py-0.5 text-xs focus-visible:ring-2 focus-visible:outline-none"
      >
        {open ? <ChevronDown className="size-4" aria-hidden /> : <ChevronRight className="size-4" aria-hidden />}
        {open ? "Hide components" : "Show components"}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ComponentGroupList codebase={codebase} scan={scan} label={label} />
      </CollapsibleContent>
    </Collapsible>
  );
}
