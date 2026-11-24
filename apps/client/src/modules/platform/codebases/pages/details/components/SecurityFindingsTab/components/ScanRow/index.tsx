import React from "react";
import {
  hasActiveFindings,
  type CodebaseFindingsInput,
  type CodebaseScan,
  type RuntimeLevel,
} from "@my-project/shared";
import { TableCellUI, TableRowUI } from "@/core/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/components/ui/tabs";
import { cn } from "@/core/utils/classname";
import { NO_VALUE } from "@/modules/platform/security/components/defectdojo/constants";
import { DefectDojoLink } from "@/modules/platform/security/components/defectdojo/DefectDojoLink";
import { NoFindingsBadge } from "@/modules/platform/security/components/defectdojo/StateBlocks";
import { formatScanTime } from "@/modules/platform/security/components/defectdojo/utils";
import { CELL_CLASS } from "../../constants";
import type { SecurityFindingsFocus } from "../../types";
import { BuiltVersusRunning } from "../BuiltVersusRunning";
import { ExpandedPanelRow } from "../ExpandedPanelRow";
import { ExpandToggle } from "../ExpandToggle";
import { NameCell } from "../NameCell";
import { OwnImageBadge } from "../OwnImageBadge";
import { ScanFindings } from "../ScanFindings";
import { SeverityCountCells } from "../SeverityCountCells";

export interface ScanRowProps {
  codebase: CodebaseFindingsInput;
  scan: CodebaseScan;
  /** The containers that run in the Environments, for the comparison of an own-image scan with them. */
  runtime: RuntimeLevel;
  focus: SecurityFindingsFocus | null;
  expanded: boolean;
  onToggle: () => void;
  /** The scan has no active finding while others of its level have: the row says so. */
  markNoFindings: boolean;
}

/**
 * One scan: target, scanner, image tag, counts of its own, last upload. Expands to its findings; an own-image scan
 * also expands to its comparison with the containers that run the image.
 */
export function ScanRow({ codebase, scan, runtime, focus, expanded, onToggle, markNoFindings }: ScanRowProps) {
  const panelId = React.useId();
  const { ref } = scan;
  const target = ref.level === "code" ? "Source code" : (ref.image ?? "Image");
  const title = `${ref.scanner}, ${target}`;

  return (
    <>
      <TableRowUI data-testid="scan-row">
        <TableCellUI className={CELL_CLASS}>
          <ExpandToggle expanded={expanded} panelId={panelId} title={title} onToggle={onToggle} />
        </TableCellUI>
        <NameCell
          name={ref.scanner}
          badges={markNoFindings && !hasActiveFindings(scan.counts) && <NoFindingsBadge />}
          detail={
            <>
              {target}
              {ref.level === "image" && <OwnImageBadge ownImage={scan.ownImage} />}
            </>
          }
        />
        <TableCellUI className={cn(CELL_CLASS, "text-xs break-words")}>{ref.branch}</TableCellUI>
        <TableCellUI className={cn(CELL_CLASS, "text-xs break-all")}>{scan.version || NO_VALUE}</TableCellUI>
        <SeverityCountCells counts={scan.counts} />
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
        <ExpandedPanelRow id={panelId}>
          {scan.ownImage ? (
            <Tabs defaultValue="findings">
              <TabsList aria-label={`Views of ${title}`}>
                <TabsTrigger value="findings">Findings</TabsTrigger>
                <TabsTrigger value="built-versus-running">Built vs running</TabsTrigger>
              </TabsList>
              <TabsContent value="findings">
                <ScanFindings codebase={codebase} scan={scan} title={title} />
              </TabsContent>
              <TabsContent value="built-versus-running">
                <BuiltVersusRunning codebase={codebase} scan={scan} runtime={runtime} focus={focus} title={title} />
              </TabsContent>
            </Tabs>
          ) : (
            <ScanFindings codebase={codebase} scan={scan} title={title} />
          )}
        </ExpandedPanelRow>
      )}
    </>
  );
}
