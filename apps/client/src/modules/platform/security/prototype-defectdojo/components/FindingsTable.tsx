// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import React from "react";
import type { PrototypeDefectDojoFinding, PrototypeDefectDojoSeverity } from "@my-project/shared";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { TableBodyUI, TableCellUI, TableHeadUI, TableHeaderUI, TableRowUI, TableUI } from "@/core/components/ui/table";
import { TablePagination } from "@/core/components/ui/table-pagination";
import { cn } from "@/core/utils/classname";
import { usePrototypeDefectDojoFindings } from "../api/hooks";
import { PROTOTYPE_NO_VALUE } from "../constants";
import { formatFix } from "../utils";
import { DefectDojoLink } from "./DefectDojoLink";
import { FindingSeverityBadge, FindingStateBadges } from "./FindingBadges";
import { CleanScanBadge, UnreachableState } from "./StateBlocks";

/** `hide`: active findings only. `show`: every state, triaged rows dimmed. `only`: findings that are not active. */
export type TriagedMode = "hide" | "show" | "only";

export interface FindingsTableProps {
  testId: number;
  triaged: TriagedMode;
  severity?: PrototypeDefectDojoSeverity;
  /** Default: 10. */
  pageSize?: number;
  /** Accessible name of the table. */
  caption: string;
}

const HEAD_CLASS = "bg-muted text-muted-foreground px-3 py-2 text-xs font-medium";
const CELL_CLASS = "px-3 py-2 align-top";

function activeFilter(triaged: TriagedMode): boolean | undefined {
  if (triaged === "hide") return true;
  if (triaged === "only") return false;
  return undefined;
}

function formatLocation(finding: PrototypeDefectDojoFinding): string {
  if (finding.filePath) {
    return finding.line ? `${finding.filePath}:${finding.line}` : finding.filePath;
  }
  return finding.service ?? PROTOTYPE_NO_VALUE;
}

/** Server-paged findings of one test, most severe first. Each row links to the finding in DefectDojo. */
export function FindingsTable({ testId, triaged, severity, pageSize = 10, caption }: FindingsTableProps) {
  const filterKey = `${testId}|${triaged}|${severity ?? ""}`;
  const [paging, setPaging] = React.useState({ filterKey, page: 0, rowsPerPage: pageSize });
  // A changed filter starts at the first page.
  const page = paging.filterKey === filterKey ? paging.page : 0;
  const rowsPerPage = paging.rowsPerPage;

  const query = usePrototypeDefectDojoFindings({
    testId,
    limit: rowsPerPage,
    offset: page * rowsPerPage,
    severity,
    active: activeFilter(triaged),
  });

  if (query.isLoading) {
    return (
      <div className="flex justify-center p-6">
        <LoadingSpinner size={24} />
      </div>
    );
  }

  const result = query.data;
  if (query.isError || !result || result.state === "unreachable" || result.state === "notConfigured") {
    return <UnreachableState what="Findings" onRetry={() => void query.refetch()} compact />;
  }

  const findings = result.state === "data" ? result.data.findings : [];
  const count = result.state === "data" ? result.data.count : 0;

  if (count === 0) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 p-3 text-sm">
        {triaged === "hide" && !severity ? (
          <>
            <CleanScanBadge />
            The scan reported no active findings.
          </>
        ) : (
          "No findings match the filters."
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <TableUI aria-label={caption}>
        <TableHeaderUI>
          <TableRowUI>
            <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-24")}>
              Severity
            </TableHeadUI>
            <TableHeadUI scope="col" className={HEAD_CLASS}>
              Finding
            </TableHeadUI>
            <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-[22%]")}>
              Component
            </TableHeadUI>
            <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-28")}>
              Fix
            </TableHeadUI>
            <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-[22%]")}>
              Location
            </TableHeadUI>
            <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-12")}>
              <span className="sr-only">DefectDojo</span>
            </TableHeadUI>
          </TableRowUI>
        </TableHeaderUI>
        <TableBodyUI>
          {findings.map((finding) => (
            <TableRowUI key={finding.id} className={cn(!finding.active && "opacity-60")}>
              <TableCellUI className={CELL_CLASS}>
                <FindingSeverityBadge severity={finding.severity} />
              </TableCellUI>
              <TableCellUI className={CELL_CLASS}>
                <div className="flex min-w-0 flex-col gap-1">
                  <span className={cn("text-sm break-words", !finding.active && "line-through")}>{finding.title}</span>
                  <FindingStateBadges finding={finding} />
                </div>
              </TableCellUI>
              <TableCellUI className={cn(CELL_CLASS, "text-xs break-words")}>
                {finding.componentName ?? PROTOTYPE_NO_VALUE}
                {finding.componentVersion && <span className="text-muted-foreground"> {finding.componentVersion}</span>}
              </TableCellUI>
              <TableCellUI className={cn(CELL_CLASS, "text-xs break-words")}>{formatFix(finding)}</TableCellUI>
              <TableCellUI className={cn(CELL_CLASS, "text-muted-foreground text-xs break-all")}>
                {formatLocation(finding)}
              </TableCellUI>
              <TableCellUI className={CELL_CLASS}>
                <DefectDojoLink href={finding.url} label={`Finding ${finding.id}`} />
              </TableCellUI>
            </TableRowUI>
          ))}
        </TableBodyUI>
      </TableUI>
      <TablePagination
        totalCount={count}
        pageItemCount={findings.length}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[10, 25, 50]}
        handleChangePage={(_event, newPage) => setPaging({ filterKey, page: newPage, rowsPerPage })}
        handleChangeRowsPerPage={(event) => setPaging({ filterKey, page: 0, rowsPerPage: Number(event.target.value) })}
      />
    </div>
  );
}
