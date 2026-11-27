import {
  runtimeContainerKey,
  type CodebaseFindingsInput,
  type RuntimeEnvironment,
  type RuntimeLevel,
} from "@my-project/shared";
import { Badge } from "@/core/components/ui/badge";
import { TableBodyUI, TableCellUI, TableRowUI } from "@/core/components/ui/table";
import { cn } from "@/core/utils/classname";
import {
  CELL_CLASS,
  DEFECTDOJO_STATE_TEXT,
  LEVEL_META,
  NO_VALUE,
} from "@/modules/platform/security/components/defectdojo/constants";
import { CleanLevelState, NoScanDataState } from "@/modules/platform/security/components/defectdojo/StateBlocks";
import { NO_ENVIRONMENT_HINT } from "../../constants";
import { focusedProps } from "../../focusedProps";
import type { SecurityFindingsFocus } from "../../types";
import { isFocusedEnvironment } from "../../utils";
import { EnvironmentCell } from "../EnvironmentCell";
import { LevelHeaderRow } from "../LevelHeaderRow";
import { NoCountsCells } from "../NoCountsCells";
import { NoScanDataRow } from "../NoScanDataRow";
import { RuntimeContainerRow } from "../RuntimeContainerRow";

const RUNTIME_META = LEVEL_META.runtime;

export interface RuntimeSectionProps {
  data: RuntimeLevel;
  codebase: CodebaseFindingsInput;
  /** Keys of the expanded rows. */
  expanded: ReadonlySet<string>;
  onToggle: (key: string) => void;
  /** Its rows are marked; nothing is expanded or asked for because of it. */
  focus: SecurityFindingsFocus | null;
}

function EnvironmentNoDataRow({ environment, focused }: { environment: RuntimeEnvironment; focused: boolean }) {
  const focus = focusedProps(focused, true);

  return (
    <TableRowUI data-testid="runtime-no-data-row" {...focus} className={cn("hover:bg-transparent", focus.className)}>
      <TableCellUI className={CELL_CLASS} />
      <TableCellUI className={CELL_CLASS}>
        <NoScanDataState producer={RUNTIME_META.producer} what={RUNTIME_META.findings} />
      </TableCellUI>
      <TableCellUI className={CELL_CLASS}>
        <EnvironmentCell environment={environment} />
      </TableCellUI>
      <TableCellUI className={cn(CELL_CLASS, "text-muted-foreground text-xs")}>{NO_VALUE}</TableCellUI>
      <NoCountsCells />
    </TableRowUI>
  );
}

/** The level has no total: the vulnerabilities and the secrets of a container, and its containers, are never added. */
export function RuntimeSection({ data, codebase, expanded, onToggle, focus }: RuntimeSectionProps) {
  return (
    <TableBodyUI data-testid="section-runtime">
      <LevelHeaderRow meta={RUNTIME_META}>
        {data.state === "clean" && <CleanLevelState lastUpload={data.lastUpload} />}
        {data.state === "notRunning" && <Badge variant="neutral">{DEFECTDOJO_STATE_TEXT.notRunning}</Badge>}
      </LevelHeaderRow>

      {data.environments.length === 0 && (
        <NoScanDataRow producer={RUNTIME_META.producer} what={RUNTIME_META.findings} hint={NO_ENVIRONMENT_HINT} />
      )}

      {data.environments.map((environment) => {
        const focused = isFocusedEnvironment(environment, focus);

        if (environment.containers.length === 0) {
          return (
            <EnvironmentNoDataRow
              key={`${environment.cdPipeline}/${environment.stage}`}
              environment={environment}
              focused={focused}
            />
          );
        }

        return environment.containers.map((container, index) => {
          const key = runtimeContainerKey(environment, container);

          return (
            <RuntimeContainerRow
              key={key}
              codebase={codebase}
              environment={environment}
              container={container}
              expanded={expanded.has(key)}
              onToggle={() => onToggle(key)}
              markNoFindings={data.state === "data"}
              focused={focused}
              scrollIntoView={focused && index === 0}
            />
          );
        });
      })}
    </TableBodyUI>
  );
}
