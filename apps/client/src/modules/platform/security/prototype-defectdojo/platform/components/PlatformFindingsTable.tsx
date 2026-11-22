// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import React from "react";
import type { PrototypeDefectDojoFinding, PrototypeDefectDojoListFindingsInput } from "@my-project/shared";
import { Badge } from "@/core/components/ui/badge";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { TableBodyUI, TableCellUI, TableHeadUI, TableHeaderUI, TableRowUI, TableUI } from "@/core/components/ui/table";
import { TablePagination } from "@/core/components/ui/table-pagination";
import { cn } from "@/core/utils/classname";
import { usePrototypeDefectDojoFindings } from "../../api/hooks";
import { DefectDojoLink } from "../../components/DefectDojoLink";
import { FindingSeverityBadge, FindingStateBadges } from "../../components/FindingBadges";
import { UnreachableState } from "../../components/StateBlocks";
import { PROTOTYPE_LEVEL_META, PROTOTYPE_NO_VALUE } from "../../constants";
import { formatFix } from "../../utils";
import { describeFindingPlace } from "../model";
import type { PlatformScope } from "../types";
import { CodebaseFindingsLink, EnvironmentFindingsLink } from "./PlaceLinks";

/** Scope and filters of a platform list. Paging and `withTest` are set by the table. */
export type PlatformFindingsInput = Omit<PrototypeDefectDojoListFindingsInput, "limit" | "offset" | "withTest">;

export interface PlatformFindingsTableProps {
  scope: PlatformScope;
  input: PlatformFindingsInput;
  /** `secrets`: rule, file and line; the secret value is never part of a row. */
  kind: "vulnerabilities" | "secrets";
  /** Default: 25. At most 100. */
  pageSize?: number;
  /** `false`: the first page only, without a pager. Default: `true`. */
  paged?: boolean;
  /** Accessible name of the table. */
  caption: string;
  /** Shown when no finding matches. */
  empty: React.ReactNode;
}

const HEAD_CLASS = "bg-muted text-muted-foreground px-3 py-2 text-xs font-medium";
const CELL_CLASS = "px-3 py-2 align-top";

/** Server-paged findings across products, most severe first. Each row says where it was found and links there. */
export function PlatformFindingsTable({
  scope,
  input,
  kind,
  pageSize = 25,
  paged = true,
  caption,
  empty,
}: PlatformFindingsTableProps) {
  const filterKey = JSON.stringify(input);
  const [paging, setPaging] = React.useState({ filterKey, page: 0, rowsPerPage: pageSize });
  // A changed filter starts at the first page.
  const page = paging.filterKey === filterKey ? paging.page : 0;
  const rowsPerPage = paging.rowsPerPage;

  const query = usePrototypeDefectDojoFindings({
    ...input,
    limit: rowsPerPage,
    offset: page * rowsPerPage,
    withTest: true,
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
    return <div className="text-muted-foreground flex items-center gap-2 p-3 text-sm">{empty}</div>;
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
              {kind === "secrets" ? "Rule" : "Finding"}
            </TableHeadUI>
            <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-[18%]")}>
              {kind === "secrets" ? "File : line" : "Component"}
            </TableHeadUI>
            {kind === "vulnerabilities" && (
              <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-36")}>
                Fix
              </TableHeadUI>
            )}
            <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-[26%]")}>
              Where
            </TableHeadUI>
            <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-44")}>
              Open
            </TableHeadUI>
          </TableRowUI>
        </TableHeaderUI>
        <TableBodyUI>
          {findings.map((finding) => (
            <FindingRow key={finding.id} scope={scope} finding={finding} kind={kind} />
          ))}
        </TableBodyUI>
      </TableUI>
      {paged ? (
        <TablePagination
          totalCount={count}
          pageItemCount={findings.length}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
          handleChangePage={(_event, newPage) => setPaging({ filterKey, page: newPage, rowsPerPage })}
          handleChangeRowsPerPage={(event) =>
            setPaging({ filterKey, page: 0, rowsPerPage: Number(event.target.value) })
          }
        />
      ) : (
        <p className="text-muted-foreground text-xs">
          First {findings.length} of {count}, most severe first.
        </p>
      )}
    </div>
  );
}

interface FindingRowProps {
  scope: PlatformScope;
  finding: PrototypeDefectDojoFinding;
  kind: "vulnerabilities" | "secrets";
}

function FindingRow({ scope, finding, kind }: FindingRowProps) {
  const place = finding.test ? describeFindingPlace(scope, finding.test) : null;

  return (
    <TableRowUI className={cn(!finding.active && "opacity-60")}>
      <TableCellUI className={CELL_CLASS}>
        <FindingSeverityBadge severity={finding.severity} />
      </TableCellUI>
      <TableCellUI className={CELL_CLASS}>
        <div className="flex min-w-0 flex-col gap-1">
          <span className={cn("text-sm break-words", !finding.active && "line-through")}>{finding.title}</span>
          <FindingStateBadges finding={finding} />
        </div>
      </TableCellUI>
      <TableCellUI className={cn(CELL_CLASS, "text-xs break-all")}>
        {kind === "secrets" ? (
          <>
            {finding.filePath ?? PROTOTYPE_NO_VALUE}
            {finding.line !== null && ` : ${finding.line}`}
          </>
        ) : (
          <>
            {finding.componentName ?? PROTOTYPE_NO_VALUE}
            {finding.componentVersion && <span className="text-muted-foreground"> {finding.componentVersion}</span>}
          </>
        )}
      </TableCellUI>
      {kind === "vulnerabilities" && (
        <TableCellUI className={cn(CELL_CLASS, "text-xs")}>{formatFix(finding)}</TableCellUI>
      )}
      <TableCellUI className={cn(CELL_CLASS, "text-xs")}>
        {place ? (
          <div className="flex min-w-0 flex-col gap-1">
            <span className="flex flex-wrap items-center gap-2">
              {place.level && <Badge variant="neutral">{PROTOTYPE_LEVEL_META[place.level].label}</Badge>}
              <span className="font-medium break-all">{place.primary}</span>
            </span>
            <span className="text-muted-foreground break-all">{place.secondary}</span>
          </div>
        ) : (
          PROTOTYPE_NO_VALUE
        )}
      </TableCellUI>
      <TableCellUI className={CELL_CLASS}>
        <div className="flex flex-col items-start gap-1">
          {place?.stage && <EnvironmentFindingsLink scope={scope} stage={place.stage} />}
          {place?.codebaseName && <CodebaseFindingsLink scope={scope} codebaseName={place.codebaseName} />}
          <DefectDojoLink href={finding.url} label={`Finding ${finding.id}`}>
            DefectDojo
          </DefectDojoLink>
        </div>
      </TableCellUI>
    </TableRowUI>
  );
}
