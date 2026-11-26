import React from "react";
import {
  hasActiveRuntimeFindings,
  type CodebaseFindingsInput,
  type RuntimeContainer,
  type RuntimeEnvironment,
} from "@my-project/shared";
import { Badge } from "@/core/components/ui/badge";
import { TableCellUI, TableRowUI } from "@/core/components/ui/table";
import { cn } from "@/core/utils/classname";
import { CELL_CLASS, NO_VALUE } from "@/modules/platform/security/components/defectdojo/constants";
import { DefectDojoLink } from "@/modules/platform/security/components/defectdojo/DefectDojoLink";
import { NameCell } from "@/modules/platform/security/components/defectdojo/NameCell";
import { OwnImageBadge } from "@/modules/platform/security/components/defectdojo/OwnImageBadge";
import { SeverityCountCells } from "@/modules/platform/security/components/defectdojo/SeverityCountCells";
import { NoFindingsBadge } from "@/modules/platform/security/components/defectdojo/StateBlocks";
import { formatScanTime } from "@/modules/platform/security/components/defectdojo/utils";
import { focusedProps } from "../../focusedProps";
import { containerLabel, containerTestUrl } from "../../utils";
import { EnvironmentCell } from "../EnvironmentCell";
import { ExpandedPanelRow } from "../ExpandedPanelRow";
import { ExpandToggle } from "../ExpandToggle";
import { NoCountsCells } from "../NoCountsCells";
import { RuntimeFindings } from "../RuntimeFindings";
import { SecretsBadge } from "../SecretsBadge";

export interface RuntimeContainerRowProps {
  codebase: CodebaseFindingsInput;
  environment: RuntimeEnvironment;
  container: RuntimeContainer;
  expanded: boolean;
  onToggle: () => void;
  /** The container has no active finding while others of the level have: the row says so. */
  markNoFindings: boolean;
  focused: boolean;
  scrollIntoView: boolean;
}

export function RuntimeContainerRow({
  codebase,
  environment,
  container,
  expanded,
  onToggle,
  markNoFindings,
  focused,
  scrollIntoView,
}: RuntimeContainerRowProps) {
  const panelId = React.useId();
  const title = containerLabel(environment, container);
  const focus = focusedProps(focused, scrollIntoView);

  if (container.state === "notRunning") {
    return (
      <TableRowUI data-testid="runtime-row" {...focus}>
        <TableCellUI className={CELL_CLASS} />
        <NameCell
          name={container.container}
          badges={<Badge variant="neutral">Not running</Badge>}
          detail={container.workload}
        />
        <TableCellUI className={CELL_CLASS}>
          <EnvironmentCell environment={environment} />
        </TableCellUI>
        <TableCellUI className={cn(CELL_CLASS, "text-muted-foreground text-xs")}>{NO_VALUE}</TableCellUI>
        <NoCountsCells missing="not running" />
      </TableRowUI>
    );
  }

  const { vulnerabilities, secrets } = container;
  const testUrl = containerTestUrl(container);

  return (
    <>
      <TableRowUI data-testid="runtime-row" {...focus}>
        <TableCellUI className={CELL_CLASS}>
          <ExpandToggle expanded={expanded} panelId={panelId} title={title} onToggle={onToggle} />
        </TableCellUI>
        <NameCell
          name={container.container}
          badges={
            <>
              <OwnImageBadge ownImage={container.ownImage} />
              {markNoFindings && !hasActiveRuntimeFindings(container) && <NoFindingsBadge />}
            </>
          }
          detail={
            <>
              {container.workload}
              <SecretsBadge active={secrets?.active ?? null} />
            </>
          }
        />
        <TableCellUI className={CELL_CLASS}>
          <EnvironmentCell environment={environment} />
        </TableCellUI>
        <TableCellUI className={cn(CELL_CLASS, "text-xs break-all")}>{container.version || NO_VALUE}</TableCellUI>
        <SeverityCountCells counts={vulnerabilities?.counts ?? null} missing="no vulnerability report" />
        <TableCellUI className={cn(CELL_CLASS, "text-muted-foreground text-center text-xs")}>
          {vulnerabilities?.triaged ?? NO_VALUE}
        </TableCellUI>
        <TableCellUI className={cn(CELL_CLASS, "text-muted-foreground text-xs")}>
          {formatScanTime(container.date)}
        </TableCellUI>
        <TableCellUI className={CELL_CLASS}>
          {testUrl && <DefectDojoLink href={testUrl} label={`Test of ${title}`} />}
        </TableCellUI>
      </TableRowUI>
      {expanded && (
        <ExpandedPanelRow id={panelId}>
          <RuntimeFindings codebase={codebase} environment={environment} container={container} />
        </ExpandedPanelRow>
      )}
    </>
  );
}
