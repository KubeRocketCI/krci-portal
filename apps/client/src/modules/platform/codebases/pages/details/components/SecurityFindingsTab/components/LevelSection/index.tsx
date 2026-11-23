import {
  DEFECTDOJO_SEVERITIES,
  scanRefKey,
  type CodebaseFindingsInput,
  type CodebaseLevel,
  type CodebaseScanLevel,
} from "@my-project/shared";
import { TableBodyUI, TableCellUI, TableHeadUI, TableRowUI } from "@/core/components/ui/table";
import { cn } from "@/core/utils/classname";
import { NO_VALUE } from "@/modules/platform/security/components/defectdojo/constants";
import { NoFindingsBadge, NoScanDataState } from "@/modules/platform/security/components/defectdojo/StateBlocks";
import { formatScanTime } from "@/modules/platform/security/components/defectdojo/utils";
import { SeverityCountBadge } from "@/modules/platform/security/components/shared/SeverityCountBadge";
import { COLUMN_COUNT, LEVEL_META, SCAN_PRODUCER } from "../../constants";
import { CELL_CLASS, ScanRow } from "../ScanRow";

export interface LevelSectionProps {
  level: CodebaseScanLevel;
  data: CodebaseLevel;
  codebase: CodebaseFindingsInput;
  /** Keys of the expanded scans. */
  expanded: ReadonlySet<string>;
  onToggle: (key: string) => void;
}

/**
 * The scans of one level. A level without a scan is one dash row that names the producer; a level whose scans
 * hold no active finding says "No findings" with the date of its last upload. The level has no total: counts
 * are per scan, and two scanners of one target are never added.
 */
export function LevelSection({ level, data, codebase, expanded, onToggle }: LevelSectionProps) {
  const meta = LEVEL_META[level];
  const Icon = meta.icon;

  return (
    <TableBodyUI data-testid={`section-${level}`}>
      <TableRowUI className="bg-input/40 hover:bg-input/40">
        <TableHeadUI scope="rowgroup" colSpan={COLUMN_COUNT} className="px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className="text-foreground text-sm font-semibold">{meta.label}</span>
            <span className="text-muted-foreground text-xs font-normal">{meta.subject}</span>
            {data.state === "clean" && (
              <span className="ml-auto flex items-center gap-2 text-xs font-normal">
                <NoFindingsBadge />
                <span className="text-muted-foreground">Last upload {formatScanTime(data.lastUpload)}</span>
              </span>
            )}
          </div>
        </TableHeadUI>
      </TableRowUI>

      {data.state === "noScanData" && (
        <TableRowUI className="hover:bg-transparent">
          <TableCellUI className={CELL_CLASS} />
          <TableCellUI className={CELL_CLASS} colSpan={3}>
            <NoScanDataState producer={SCAN_PRODUCER} what={meta.findings} />
          </TableCellUI>
          {DEFECTDOJO_SEVERITIES.map((severity) => (
            <TableCellUI key={severity} className={cn(CELL_CLASS, "text-center")}>
              <SeverityCountBadge severity={severity} count={null} ariaLabel={`${severity}: no scan data`} />
            </TableCellUI>
          ))}
          <TableCellUI className={cn(CELL_CLASS, "text-muted-foreground text-center")}>{NO_VALUE}</TableCellUI>
          <TableCellUI className={cn(CELL_CLASS, "text-muted-foreground")}>{NO_VALUE}</TableCellUI>
          <TableCellUI className={CELL_CLASS} />
        </TableRowUI>
      )}

      {data.scans.map((scan) => {
        const key = scanRefKey(scan.ref);

        return (
          <ScanRow
            key={key}
            codebase={codebase}
            scan={scan}
            expanded={expanded.has(key)}
            onToggle={() => onToggle(key)}
            markNoFindings={data.state === "data"}
          />
        );
      })}
    </TableBodyUI>
  );
}
