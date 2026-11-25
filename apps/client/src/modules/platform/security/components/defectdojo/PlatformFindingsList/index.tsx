import {
  hasFindingFilter,
  type CodebaseScanLevel,
  type ExposedSecretsRequest,
  type PlatformFinding,
  type PlatformFindingsList as PlatformFindingsListData,
  type VulnerabilitiesRequest,
} from "@my-project/shared";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { TablePagination } from "@/core/components/ui/table-pagination";
import { cn } from "@/core/utils/classname";
import { LEVEL_META, PLATFORM_LIST_PAGE_SIZES } from "../constants";
import { FindingsTable, type FindingColumn, type FindingsTableProps } from "../FindingsTable";
import { FoundIn } from "../FoundIn";
import {
  LoadFailedState,
  NoFindingsBadge,
  NoScanDataState,
  NotConfiguredState,
  UnreachableState,
} from "../StateBlocks";
import { findingsFailed } from "../utils";

export interface PlatformFindingsQuery {
  data: PlatformFindingsListData | undefined;
  error: { message: string } | null;
  isError: boolean;
  isFetching: boolean;
  isPlaceholderData: boolean;
  refetch: () => unknown;
}

export interface PlatformFindingsListProps {
  query: PlatformFindingsQuery;
  input: VulnerabilitiesRequest | ExposedSecretsRequest;
  columns: CodebaseScanLevel;
  caption: string;
  /** The list in "{name} cannot be loaded.". */
  name: string;
  /** The noun of "The {producer} has not reported {what} for this installation" (or this codebase). */
  what: string;
  headers?: FindingsTableProps["headers"];
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  clusterName: string;
}

export function PlatformFindingsList({
  query,
  input,
  columns,
  caption,
  name,
  what,
  headers,
  onPageChange,
  onRowsPerPageChange,
  clusterName,
}: PlatformFindingsListProps) {
  const result = query.data;
  const retry = () => void query.refetch();

  if (result?.state === "notConfigured") {
    return <NotConfiguredState />;
  }
  if (findingsFailed(query)) {
    return result === undefined ? (
      <LoadFailedState message={query.error?.message ?? ""} onRetry={retry} isRetrying={query.isFetching} />
    ) : (
      <UnreachableState what={name} wholePage onRetry={retry} isRetrying={query.isFetching} />
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
    const subject = input.level !== "runtime" && input.codebase ? "this codebase" : "this installation";
    return <NoScanDataState producer={LEVEL_META[input.level].producer} what={what} subject={subject} />;
  }
  if (result.state !== "data") {
    return null;
  }

  if (result.total === 0) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 p-3 text-sm">
        {hasFindingFilter(input) ? (
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
        level={columns}
        caption={caption}
        extraColumn={foundIn}
        headers={headers}
      />
      <TablePagination
        totalCount={result.total}
        pageItemCount={result.findings.length}
        page={input.page}
        rowsPerPage={input.pageSize}
        rowsPerPageOptions={PLATFORM_LIST_PAGE_SIZES}
        handleChangePage={(_event, nextPage) => onPageChange(nextPage)}
        handleChangeRowsPerPage={(event) => onRowsPerPageChange(Number(event.target.value))}
      />
    </div>
  );
}
