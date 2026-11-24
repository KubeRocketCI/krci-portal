import {
  scanRefKey,
  type CodebaseFindingsInput,
  type CodebaseLevel,
  type CodebaseScanLevel,
  type RuntimeLevel,
} from "@my-project/shared";
import { TableBodyUI } from "@/core/components/ui/table";
import { LEVEL_META, SCAN_PRODUCER } from "../../constants";
import type { SecurityFindingsFocus } from "../../types";
import { CleanLevelState, LevelHeaderRow } from "../LevelHeaderRow";
import { NoScanDataRow } from "../NoScanDataRow";
import { ScanRow } from "../ScanRow";

export interface LevelSectionProps {
  level: CodebaseScanLevel;
  data: CodebaseLevel;
  /** The containers that run in the Environments: an own-image scan compares itself with them. */
  runtime: RuntimeLevel;
  focus: SecurityFindingsFocus | null;
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
export function LevelSection({ level, data, runtime, focus, codebase, expanded, onToggle }: LevelSectionProps) {
  const meta = LEVEL_META[level];

  return (
    <TableBodyUI data-testid={`section-${level}`}>
      <LevelHeaderRow meta={meta}>
        {data.state === "clean" && <CleanLevelState lastUpload={data.lastUpload} />}
      </LevelHeaderRow>

      {data.state === "noScanData" && <NoScanDataRow producer={SCAN_PRODUCER} what={meta.findings} />}

      {data.scans.map((scan) => {
        const key = scanRefKey(scan.ref);

        return (
          <ScanRow
            key={key}
            codebase={codebase}
            scan={scan}
            runtime={runtime}
            focus={focus}
            expanded={expanded.has(key)}
            onToggle={() => onToggle(key)}
            markNoFindings={data.state === "data"}
          />
        );
      })}
    </TableBodyUI>
  );
}
