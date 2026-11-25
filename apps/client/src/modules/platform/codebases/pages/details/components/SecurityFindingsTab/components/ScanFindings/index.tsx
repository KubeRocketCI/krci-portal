import React from "react";
import {
  SCAN_FINDINGS_DEFAULT_PAGE_SIZE,
  type CodebaseFindingsInput,
  type DefectDojoSeverity,
  type ScanRef,
} from "@my-project/shared";
import { Label } from "@/core/components/ui/label";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { Switch } from "@/core/components/ui/switch";
import { TablePagination } from "@/core/components/ui/table-pagination";
import { cn } from "@/core/utils/classname";
import { DefectDojoLink } from "@/modules/platform/security/components/defectdojo/DefectDojoLink";
import { FindingsTable } from "@/modules/platform/security/components/defectdojo/FindingsTable";
import { SeverityFilter } from "@/modules/platform/security/components/defectdojo/SeverityFilter";
import { NoFindingsBadge, UnreachableState } from "@/modules/platform/security/components/defectdojo/StateBlocks";
import { findingsFailed, formatScanTime } from "@/modules/platform/security/components/defectdojo/utils";
import { FINDINGS_PAGE_SIZES, NO_SCAN_DATA_MESSAGE } from "../../constants";
import { useScanFindings } from "../../hooks/useScanFindings";
import { findingsLayout } from "../../utils";

/** What the findings of a scan need to know of it. A `CodebaseScan` fits; so does one report of a container. */
export interface FindingsOwner {
  ref: ScanRef;
  /** Findings that are not active. */
  triaged: number;
  testUrl: string;
  productUrl: string;
  /** Last upload. */
  date: string;
}

export interface ScanFindingsProps {
  codebase: CodebaseFindingsInput;
  scan: FindingsOwner;
  /** What the scan is, for the accessible name of its table: scanner and target, or container and Environment. */
  title: string;
}

/** The findings of one scan: active ones, or every triaged one too; filtered by severity; a page at a time. */
export function ScanFindings({ codebase, scan, title }: ScanFindingsProps) {
  const [severity, setSeverity] = React.useState<DefectDojoSeverity | undefined>(undefined);
  const [showTriaged, setShowTriaged] = React.useState(false);
  const [page, setPage] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(SCAN_FINDINGS_DEFAULT_PAGE_SIZE);
  const triagedSwitchId = React.useId();

  const query = useScanFindings({
    ...codebase,
    scan: scan.ref,
    severity,
    showTriaged,
    page,
    pageSize,
  });

  const handleSeverityChange = (next: DefectDojoSeverity | undefined) => {
    setSeverity(next);
    setPage(0);
  };

  const handleTriagedChange = (next: boolean) => {
    setShowTriaged(next);
    setPage(0);
  };

  const result = query.data;
  const failed = findingsFailed(query);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4">
        <SeverityFilter value={severity} onChange={handleSeverityChange} />
        <div className="flex items-center gap-2">
          <Switch id={triagedSwitchId} checked={showTriaged} onCheckedChange={handleTriagedChange} />
          <Label htmlFor={triagedSwitchId}>Show triaged ({scan.triaged})</Label>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <DefectDojoLink href={scan.testUrl} label={`Test of ${title}`}>
            Test
          </DefectDojoLink>
          <DefectDojoLink href={scan.productUrl} label="Product">
            Product
          </DefectDojoLink>
        </div>
      </div>

      {failed && (
        <UnreachableState what="Findings" onRetry={() => void query.refetch()} isRetrying={query.isFetching} />
      )}
      {result === undefined && !failed && (
        <div className="flex justify-center p-6">
          <LoadingSpinner size={24} />
        </div>
      )}
      {result?.state === "noScanData" && <p className="text-muted-foreground p-3 text-sm">{NO_SCAN_DATA_MESSAGE}</p>}
      {result?.state === "data" && result.total === 0 && (
        <div className="text-muted-foreground flex items-center gap-2 p-3 text-sm">
          {severity === undefined && !showTriaged ? (
            <>
              <NoFindingsBadge />
              No active findings. Last upload {formatScanTime(scan.date)}.
            </>
          ) : (
            "No findings match the filters."
          )}
        </div>
      )}
      {result?.state === "data" && result.total > 0 && (
        <div className={cn("space-y-2", query.isPlaceholderData && "opacity-60")} aria-busy={query.isPlaceholderData}>
          <FindingsTable findings={result.findings} level={findingsLayout(scan.ref)} caption={`Findings of ${title}`} />
          {result.total > SCAN_FINDINGS_DEFAULT_PAGE_SIZE && (
            <TablePagination
              totalCount={result.total}
              pageItemCount={result.findings.length}
              page={page}
              rowsPerPage={pageSize}
              rowsPerPageOptions={FINDINGS_PAGE_SIZES}
              handleChangePage={(_event, nextPage) => setPage(nextPage)}
              handleChangeRowsPerPage={(event) => {
                setPageSize(Number(event.target.value));
                setPage(0);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
