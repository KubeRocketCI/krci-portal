import { hasVulnerabilityFilter, type PlatformFinding, type VulnerabilitiesRequest } from "@my-project/shared";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { TablePagination } from "@/core/components/ui/table-pagination";
import { cn } from "@/core/utils/classname";
import { LEVEL_META } from "@/modules/platform/security/components/defectdojo/constants";
import { FindingsTable, type FindingColumn } from "@/modules/platform/security/components/defectdojo/FindingsTable";
import {
  LoadFailedState,
  NoFindingsBadge,
  NoScanDataState,
  NotConfiguredState,
  UnreachableState,
} from "@/modules/platform/security/components/defectdojo/StateBlocks";
import { findingsFailed } from "@/modules/platform/security/components/defectdojo/utils";
import { VULNERABILITIES_PAGE_SIZES } from "../../constants";
import type { useVulnerabilities } from "../../hooks/useVulnerabilities";
import { FoundIn } from "../FoundIn";

export interface VulnerabilitiesListProps {
  query: ReturnType<typeof useVulnerabilities>;
  input: VulnerabilitiesRequest;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  clusterName: string;
}

export function VulnerabilitiesList({
  query,
  input,
  onPageChange,
  onRowsPerPageChange,
  clusterName,
}: VulnerabilitiesListProps) {
  const result = query.data;
  const retry = () => void query.refetch();

  if (result?.state === "notConfigured") {
    return <NotConfiguredState />;
  }
  if (findingsFailed(query)) {
    return result === undefined ? (
      <LoadFailedState message={query.error?.message ?? ""} onRetry={retry} isRetrying={query.isFetching} />
    ) : (
      <UnreachableState what="Vulnerabilities" wholePage onRetry={retry} isRetrying={query.isFetching} />
    );
  }
  if (result === undefined) {
    return (
      <div className="flex justify-center p-12">
        <LoadingSpinner />
      </div>
    );
  }
  if (result.state === "noScanData") {
    return (
      <NoScanDataState
        producer={LEVEL_META[input.level].producer}
        what="vulnerability findings"
        subject="this installation"
      />
    );
  }
  if (result.state !== "data") {
    return null;
  }

  if (result.total === 0) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 p-3 text-sm">
        {hasVulnerabilityFilter(input) ? (
          "No findings match the filters."
        ) : (
          <>
            <NoFindingsBadge />
            No active findings.
          </>
        )}
      </div>
    );
  }

  const foundIn: FindingColumn<PlatformFinding> = {
    id: "foundIn",
    header: "Found in",
    headClassName: "w-[24%]",
    cellClassName: "text-xs",
    cell: (finding) => <FoundIn place={finding.place} clusterName={clusterName} namespace={input.namespace} />,
  };

  return (
    <div className={cn("space-y-2", query.isPlaceholderData && "opacity-60")} aria-busy={query.isPlaceholderData}>
      {result.truncated && (
        <p className="text-muted-foreground text-xs">
          The list holds the {result.total} most severe findings of this state; DefectDojo has more.
        </p>
      )}
      <FindingsTable
        findings={result.findings}
        level={input.level === "code" ? "code" : "image"}
        caption="Vulnerability findings"
        extraColumn={foundIn}
      />
      <TablePagination
        totalCount={result.total}
        pageItemCount={result.findings.length}
        page={input.page}
        rowsPerPage={input.pageSize}
        rowsPerPageOptions={VULNERABILITIES_PAGE_SIZES}
        handleChangePage={(_event, nextPage) => onPageChange(nextPage)}
        handleChangeRowsPerPage={(event) => onRowsPerPageChange(Number(event.target.value))}
      />
    </div>
  );
}
