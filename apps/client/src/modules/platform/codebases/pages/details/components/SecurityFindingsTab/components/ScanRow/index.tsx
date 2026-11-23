import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { DEFECTDOJO_SEVERITIES, type CodebaseFindingsInput, type CodebaseScan } from "@my-project/shared";
import { Badge } from "@/core/components/ui/badge";
import { TableCellUI, TableRowUI } from "@/core/components/ui/table";
import { cn } from "@/core/utils/classname";
import { NO_VALUE } from "@/modules/platform/security/components/defectdojo/constants";
import { DefectDojoLink } from "@/modules/platform/security/components/defectdojo/DefectDojoLink";
import { NoFindingsBadge } from "@/modules/platform/security/components/defectdojo/StateBlocks";
import { formatScanTime } from "@/modules/platform/security/components/defectdojo/utils";
import { SeverityCountBadge } from "@/modules/platform/security/components/shared/SeverityCountBadge";
import { COLUMN_COUNT } from "../../constants";
import { ScanFindings } from "../ScanFindings";

export const CELL_CLASS = "px-3 py-2 align-middle";

export interface ScanRowProps {
  codebase: CodebaseFindingsInput;
  scan: CodebaseScan;
  expanded: boolean;
  onToggle: () => void;
  /** The scan has no active finding while others of its level have: the row says so. */
  markNoFindings: boolean;
}

/** One scan: target, scanner, image tag, counts of its own, last upload. Expands to its findings. */
export function ScanRow({ codebase, scan, expanded, onToggle, markNoFindings }: ScanRowProps) {
  const panelId = React.useId();
  const { ref } = scan;
  const target = ref.level === "code" ? "Source code" : (ref.image ?? "Image");
  const title = `${ref.scanner}, ${target}`;
  const hasActiveFinding = DEFECTDOJO_SEVERITIES.some((severity) => scan.counts[severity] > 0);

  return (
    <>
      <TableRowUI data-testid="scan-row">
        <TableCellUI className={CELL_CLASS}>
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={panelId}
            aria-label={`${expanded ? "Hide" : "Show"} findings of ${title}`}
            onClick={onToggle}
            className="hover:bg-input focus-visible:ring-ring rounded p-1 focus-visible:ring-2 focus-visible:outline-none"
          >
            {expanded ? (
              <ChevronDown className="size-4" aria-hidden />
            ) : (
              <ChevronRight className="size-4" aria-hidden />
            )}
          </button>
        </TableCellUI>
        <TableCellUI className={CELL_CLASS}>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium break-all">{ref.scanner}</span>
              {markNoFindings && !hasActiveFinding && <NoFindingsBadge />}
            </span>
            <span className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs break-all">
              {target}
              {ref.level === "image" && (
                <Badge variant={scan.ownImage ? "info" : "neutral"}>
                  {scan.ownImage ? "Own image" : "Third-party image"}
                </Badge>
              )}
            </span>
          </div>
        </TableCellUI>
        <TableCellUI className={cn(CELL_CLASS, "text-xs break-words")}>{ref.branch}</TableCellUI>
        <TableCellUI className={cn(CELL_CLASS, "text-xs break-all")}>{scan.version || NO_VALUE}</TableCellUI>
        {DEFECTDOJO_SEVERITIES.map((severity) => (
          <TableCellUI key={severity} className={cn(CELL_CLASS, "text-center")}>
            <SeverityCountBadge
              severity={severity}
              count={scan.counts[severity]}
              ariaLabel={`${severity}: ${scan.counts[severity]}`}
            />
          </TableCellUI>
        ))}
        <TableCellUI className={cn(CELL_CLASS, "text-muted-foreground text-center text-xs")}>
          {scan.triaged}
        </TableCellUI>
        <TableCellUI className={cn(CELL_CLASS, "text-muted-foreground text-xs")}>
          {formatScanTime(scan.date)}
        </TableCellUI>
        <TableCellUI className={CELL_CLASS}>
          <DefectDojoLink href={scan.testUrl} label={`Test of ${title}`} />
        </TableCellUI>
      </TableRowUI>
      {expanded && (
        <TableRowUI id={panelId} className="hover:bg-transparent">
          <TableCellUI className="bg-muted/30 p-3" colSpan={COLUMN_COUNT}>
            <ScanFindings codebase={codebase} scan={scan} title={title} />
          </TableCellUI>
        </TableRowUI>
      )}
    </>
  );
}
