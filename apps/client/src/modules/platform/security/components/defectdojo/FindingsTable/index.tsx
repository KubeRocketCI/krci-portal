import type { ReactNode } from "react";
import type { CodebaseScanLevel, ScanFinding } from "@my-project/shared";
import { Badge } from "@/core/components/ui/badge";
import { TableBodyUI, TableCellUI, TableHeadUI, TableHeaderUI, TableRowUI, TableUI } from "@/core/components/ui/table";
import { cn } from "@/core/utils/classname";
import { SeverityBadge } from "@/modules/platform/security/components/shared/SeverityBadge";
import { HEAD_CLASS, NO_VALUE } from "../constants";
import { DefectDojoLink } from "../DefectDojoLink";
import { formatFix, formatLocation, getFindingStates } from "../utils";

export interface FindingColumn<Finding = ScanFinding> {
  id: string;
  header: ReactNode;
  headClassName?: string;
  cellClassName?: string;
  cell: (finding: Finding) => ReactNode;
}

export interface FindingsTableProps<Finding extends ScanFinding = ScanFinding> {
  findings: Finding[];
  /** Code findings have a place in the source; image findings have a component and a fix. */
  level: CodebaseScanLevel;
  /** Accessible name of the table. */
  caption: string;
  /** One more column, before the DefectDojo link. */
  extraColumn?: FindingColumn<Finding>;
}

const CELL_CLASS = "px-3 py-2 align-top";

const SEVERITY_COLUMN: FindingColumn = {
  id: "severity",
  header: "Severity",
  headClassName: "w-24",
  cell: (finding) => <SeverityBadge severity={finding.severity} />,
};

const FINDING_COLUMN: FindingColumn = {
  id: "finding",
  header: "Finding",
  cell: (finding) => {
    const states = getFindingStates(finding);

    return (
      <div className="flex min-w-0 flex-col gap-1">
        <span className={cn("text-sm break-words", !finding.active && "line-through")}>{finding.title}</span>
        {states.length > 0 && (
          <span className="inline-flex flex-wrap items-center gap-1">
            {states.map((state) => (
              <Badge key={state} variant="neutral">
                {state}
              </Badge>
            ))}
          </span>
        )}
      </div>
    );
  },
};

const LOCATION_COLUMN: FindingColumn = {
  id: "location",
  header: "Location",
  headClassName: "w-[30%]",
  cellClassName: "text-muted-foreground text-xs break-all",
  cell: formatLocation,
};

const VULNERABILITY_COLUMN: FindingColumn = {
  id: "vulnerability",
  header: "Vulnerability",
  headClassName: "w-[18%]",
  cellClassName: "text-xs break-all",
  cell: (finding) => (finding.vulnerabilityIds.length > 0 ? finding.vulnerabilityIds.join(", ") : NO_VALUE),
};

const COMPONENT_COLUMN: FindingColumn = {
  id: "component",
  header: "Component",
  headClassName: "w-[20%]",
  cellClassName: "text-xs break-words",
  cell: (finding) => (
    <>
      {finding.componentName ?? NO_VALUE}
      {finding.componentVersion && <span className="text-muted-foreground"> {finding.componentVersion}</span>}
    </>
  ),
};

const FIX_COLUMN: FindingColumn = {
  id: "fix",
  header: "Fix",
  headClassName: "w-36",
  cellClassName: "text-xs break-words",
  cell: formatFix,
};

const LINK_COLUMN: FindingColumn = {
  id: "link",
  header: <span className="sr-only">DefectDojo</span>,
  headClassName: "w-14",
  cell: (finding) => <DefectDojoLink href={finding.url} label={`Finding ${finding.title}`} />,
};

const COLUMNS: Record<CodebaseScanLevel, FindingColumn[]> = {
  code: [SEVERITY_COLUMN, FINDING_COLUMN, LOCATION_COLUMN, LINK_COLUMN],
  image: [SEVERITY_COLUMN, FINDING_COLUMN, VULNERABILITY_COLUMN, COMPONENT_COLUMN, FIX_COLUMN, LINK_COLUMN],
};

/** A finding that is not active is dimmed, with its triage states. Each links to DefectDojo. */
export function FindingsTable<Finding extends ScanFinding>({
  findings,
  level,
  caption,
  extraColumn,
}: FindingsTableProps<Finding>) {
  const levelColumns: FindingColumn<Finding>[] = COLUMNS[level];
  const columns = extraColumn
    ? levelColumns.flatMap((column) => (column.id === LINK_COLUMN.id ? [extraColumn, column] : [column]))
    : levelColumns;

  return (
    <TableUI aria-label={caption}>
      <TableHeaderUI>
        <TableRowUI>
          {columns.map((column) => (
            <TableHeadUI key={column.id} scope="col" className={cn(HEAD_CLASS, column.headClassName)}>
              {column.header}
            </TableHeadUI>
          ))}
        </TableRowUI>
      </TableHeaderUI>
      <TableBodyUI>
        {findings.map((finding) => (
          <TableRowUI key={finding.url} className={cn(!finding.active && "opacity-60")}>
            {columns.map((column) => (
              <TableCellUI key={column.id} className={cn(CELL_CLASS, column.cellClassName)}>
                {column.cell(finding)}
              </TableCellUI>
            ))}
          </TableRowUI>
        ))}
      </TableBodyUI>
    </TableUI>
  );
}
