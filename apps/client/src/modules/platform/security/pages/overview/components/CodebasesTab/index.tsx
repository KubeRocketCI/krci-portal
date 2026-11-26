import { scanRefKey, type OverviewCodebase, type OverviewScan } from "@my-project/shared";
import { Card } from "@/core/components/ui/card";
import { TableBodyUI, TableCellUI, TableHeadUI, TableHeaderUI, TableRowUI, TableUI } from "@/core/components/ui/table";
import { cn } from "@/core/utils/classname";
import {
  CELL_CLASS,
  HEAD_CLASS,
  LEVEL_META,
  NO_VALUE,
} from "@/modules/platform/security/components/defectdojo/constants";
import { DefectDojoLink } from "@/modules/platform/security/components/defectdojo/DefectDojoLink";
import { CodebaseLink } from "@/modules/platform/security/components/defectdojo/FoundIn";
import { NameCell } from "@/modules/platform/security/components/defectdojo/NameCell";
import { OwnImageBadge } from "@/modules/platform/security/components/defectdojo/OwnImageBadge";
import {
  SeverityCountCells,
  SeverityHeadCells,
} from "@/modules/platform/security/components/defectdojo/SeverityCountCells";
import { NoScanDataState } from "@/modules/platform/security/components/defectdojo/StateBlocks";
import { formatScanTime } from "@/modules/platform/security/components/defectdojo/utils";
import { CODEBASES_PART } from "../../constants";
import { codebaseListSearch, type LinkContext } from "../../utils/links";
import { scanTarget } from "../../utils/model";
import { ScanListLink } from "../ListLinks";
import { Note } from "../Note";

/** The codebase: a link to its "Security Findings" tab, or its name when no Codebase of that name can be read. */
export function CodebaseName({ codebase, known, links }: { codebase: string; known: boolean; links: LinkContext }) {
  return known ? (
    <CodebaseLink clusterName={links.clusterName} namespace={links.namespace} codebase={codebase} />
  ) : (
    <span className="text-sm break-all" title="No Codebase of this name">
      {codebase}
    </span>
  );
}

interface CodebaseScanRowProps {
  codebase: OverviewCodebase;
  scan: OverviewScan;
  first: boolean;
  links: LinkContext;
}

function CodebaseScanRow({ codebase, scan, first, links }: CodebaseScanRowProps) {
  const { ref } = scan;

  return (
    <TableRowUI data-testid="codebase-scan-row">
      <TableCellUI className={CELL_CLASS}>
        {first && <CodebaseName codebase={codebase.codebase} known={codebase.known} links={links} />}
      </TableCellUI>
      <TableCellUI className={cn(CELL_CLASS, "text-xs")}>{LEVEL_META[ref.level].label}</TableCellUI>
      <NameCell
        name={ref.scanner}
        detail={
          <>
            {scanTarget(scan)}
            {ref.level === "image" && scan.ownImage !== null && <OwnImageBadge ownImage={scan.ownImage} />}
          </>
        }
      />
      <SeverityCountCells counts={scan.counts} />
      <TableCellUI className={cn(CELL_CLASS, "text-muted-foreground text-xs")}>{formatScanTime(scan.date)}</TableCellUI>
      <TableCellUI className={CELL_CLASS}>
        <span className="flex items-center gap-2">
          <ScanListLink
            clusterName={links.clusterName}
            scanType={ref.scanner}
            level={ref.level}
            search={codebaseListSearch(codebase.codebase, links)}
            label={`${ref.scanner} findings of ${codebase.codebase}`}
          />
          <DefectDojoLink href={scan.testUrl} label={`Test of ${ref.scanner}, ${codebase.codebase}`} />
        </span>
      </TableCellUI>
    </TableRowUI>
  );
}

function UnscannedRow({ codebase, links }: { codebase: string; links: LinkContext }) {
  return (
    <TableRowUI className="hover:bg-transparent" data-testid={`codebase-no-data-${codebase}`}>
      <TableCellUI className={CELL_CLASS}>
        <CodebaseName codebase={codebase} known links={links} />
      </TableCellUI>
      <TableCellUI className={cn(CELL_CLASS, "text-muted-foreground text-xs")}>{NO_VALUE}</TableCellUI>
      <TableCellUI className={CELL_CLASS}>
        <NoScanDataState producer={CODEBASES_PART.producer} what={CODEBASES_PART.what} />
      </TableCellUI>
      <SeverityCountCells counts={null} />
      <TableCellUI className={cn(CELL_CLASS, "text-muted-foreground text-xs")}>{NO_VALUE}</TableCellUI>
      <TableCellUI className={CELL_CLASS} />
    </TableRowUI>
  );
}

export interface CodebasesTabProps {
  /** The codebases in view, by name, with their scans in view. */
  codebases: OverviewCodebase[];
  /** The Codebases without scan data in view. */
  unscanned: string[];
  links: LinkContext;
}

/** A row per scan of each codebase, then a row per Codebase without scan data. */
export function CodebasesTab({ codebases, unscanned, links }: CodebasesTabProps) {
  if (codebases.length === 0 && unscanned.length === 0) {
    return <Note>No codebase matches the filters.</Note>;
  }
  return (
    <Card className="p-0">
      <TableUI aria-label="Code and Image scans by codebase" className="min-w-[60rem]">
        <TableHeaderUI>
          <TableRowUI>
            <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-44")}>
              Codebase
            </TableHeadUI>
            <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-20")}>
              Level
            </TableHeadUI>
            <TableHeadUI scope="col" className={HEAD_CLASS}>
              Scan
            </TableHeadUI>
            <SeverityHeadCells />
            <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-40")}>
              Last upload
            </TableHeadUI>
            <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-20")}>
              <span className="sr-only">Links</span>
            </TableHeadUI>
          </TableRowUI>
        </TableHeaderUI>
        <TableBodyUI>
          {codebases.flatMap((codebase) =>
            codebase.scans.map((scan, index) => (
              <CodebaseScanRow
                key={`${codebase.codebase}\n${scanRefKey(scan.ref)}`}
                codebase={codebase}
                scan={scan}
                first={index === 0}
                links={links}
              />
            ))
          )}
          {unscanned.map((codebase) => (
            <UnscannedRow key={codebase} codebase={codebase} links={links} />
          ))}
        </TableBodyUI>
      </TableUI>
    </Card>
  );
}
