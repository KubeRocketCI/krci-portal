// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
// Variant C, "Coverage matrix": one table of every scan of every branch and Environment, in three
// level sections. A row expands in place to its findings; triaged findings stay in the list, dimmed.
import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type {
  PrototypeDefectDojoLevel,
  PrototypeDefectDojoSeverity,
  PrototypeDefectDojoTest,
} from "@my-project/shared";
import { Badge } from "@/core/components/ui/badge";
import { Card } from "@/core/components/ui/card";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { TableBodyUI, TableCellUI, TableHeadUI, TableHeaderUI, TableRowUI, TableUI } from "@/core/components/ui/table";
import { cn } from "@/core/utils/classname";
import { DefectDojoLink } from "@/modules/platform/security/prototype-defectdojo/components/DefectDojoLink";
import { FindingsTable } from "@/modules/platform/security/prototype-defectdojo/components/FindingsTable";
import { PrototypeStatePanel } from "@/modules/platform/security/prototype-defectdojo/components/PrototypeStatePanel";
import { SeverityCountChip } from "@/modules/platform/security/prototype-defectdojo/components/SeverityCounts";
import { SeverityFilter } from "@/modules/platform/security/prototype-defectdojo/components/SeverityFilter";
import {
  CleanScanBadge,
  NoScanDataState,
  NotConfiguredState,
  UnreachableState,
} from "@/modules/platform/security/prototype-defectdojo/components/StateBlocks";
import {
  PROTOTYPE_LEVEL_META,
  PROTOTYPE_NO_VALUE,
  PROTOTYPE_SEVERITY_KEYS,
} from "@/modules/platform/security/prototype-defectdojo/constants";
import { formatScanTime } from "@/modules/platform/security/prototype-defectdojo/utils";
import { useCodebaseFindingsModel } from "../hooks/useCodebaseFindingsModel";
import { environmentLabel, isFocusedEnvironment, testCounts, testLabel } from "../model";
import type {
  CodebaseFindingsModel,
  CodebaseFindingsVariantProps,
  EnvironmentFocus,
  LevelModel,
  ScanTarget,
} from "../types";

const LEVELS: PrototypeDefectDojoLevel[] = ["code", "image", "runtime"];

const HEAD_CLASS = "bg-muted text-muted-foreground px-3 py-2 text-xs font-medium";
const CELL_CLASS = "px-3 py-2 align-middle";
/** Expand, scan, where, version, five severities, triaged, last scan, link. */
const COLUMN_COUNT = 12;

export function VariantC({ scope, focus }: CodebaseFindingsVariantProps) {
  const model = useCodebaseFindingsModel(scope, { withInactive: true });
  const [expanded, setExpanded] = React.useState<Set<number>>(new Set());

  if (model.connection === "notConfigured") {
    return <NotConfiguredState />;
  }

  const toggle = (testId: number) => {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(testId)) {
        next.delete(testId);
      } else {
        next.add(testId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <Card className="p-0">
        <TableUI aria-label={`Security scans of ${scope.codebaseName}`}>
          <TableHeaderUI>
            <TableRowUI>
              <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-10")}>
                <span className="sr-only">Expand</span>
              </TableHeadUI>
              <TableHeadUI scope="col" className={HEAD_CLASS}>
                Scan
              </TableHeadUI>
              <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-32")}>
                Branch / Environment
              </TableHeadUI>
              <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-44")}>
                Image tag
              </TableHeadUI>
              {PROTOTYPE_SEVERITY_KEYS.map(({ severity }) => (
                <TableHeadUI key={severity} scope="col" className={cn(HEAD_CLASS, "w-16 text-center")}>
                  {severity}
                </TableHeadUI>
              ))}
              <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-16 text-center")}>
                Triaged
              </TableHeadUI>
              <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-40")}>
                Last scan
              </TableHeadUI>
              <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-12")}>
                <span className="sr-only">DefectDojo</span>
              </TableHeadUI>
            </TableRowUI>
          </TableHeaderUI>
          <TableBodyUI>
            {LEVELS.map((level) => (
              <LevelSection
                key={level}
                level={model.levels[level]}
                model={model}
                focus={focus}
                expanded={expanded}
                onToggle={toggle}
                noDataHint={
                  level === "runtime" && scope.environments.length === 0
                    ? "The codebase is not deployed to any Environment."
                    : undefined
                }
              />
            ))}
          </TableBodyUI>
        </TableUI>
      </Card>

      <PrototypeStatePanel state={{ scope, expandedTestIds: [...expanded] }} />
    </div>
  );
}

interface LevelSectionProps {
  level: LevelModel;
  model: CodebaseFindingsModel;
  focus: EnvironmentFocus | null;
  expanded: Set<number>;
  onToggle: (testId: number) => void;
  noDataHint?: string;
}

function LevelSection({ level, model, focus, expanded, onToggle, noDataHint }: LevelSectionProps) {
  const meta = PROTOTYPE_LEVEL_META[level.level];
  const Icon = meta.icon;

  return (
    <>
      {/* No level total: counts are per scan and two scanners of one target are never added. */}
      <TableRowUI className="bg-input/40 hover:bg-input/40" data-testid={`section-${level.level}`}>
        <TableCellUI className={CELL_CLASS} colSpan={COLUMN_COUNT}>
          <div className="flex items-center gap-2">
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className="text-foreground text-sm font-semibold">{meta.label}</span>
            <span className="text-muted-foreground text-xs">{meta.subject}</span>
          </div>
        </TableCellUI>
      </TableRowUI>

      {level.state === "loading" && (
        <TableRowUI>
          <TableCellUI className={CELL_CLASS} colSpan={COLUMN_COUNT}>
            <div className="flex justify-center p-2">
              <LoadingSpinner size={20} />
            </div>
          </TableCellUI>
        </TableRowUI>
      )}
      {level.state === "unreachable" && (
        <TableRowUI className="hover:bg-transparent">
          <TableCellUI className={CELL_CLASS} colSpan={COLUMN_COUNT}>
            <UnreachableState what={`${meta.label} findings`} onRetry={model.retry} />
          </TableCellUI>
        </TableRowUI>
      )}
      {level.state === "noData" && (
        <TableRowUI className="hover:bg-transparent">
          <TableCellUI className={CELL_CLASS} />
          <TableCellUI className={CELL_CLASS} colSpan={3}>
            <NoScanDataState level={level.level} hint={noDataHint} className="border-0 p-0" />
          </TableCellUI>
          {PROTOTYPE_SEVERITY_KEYS.map(({ severity }) => (
            <TableCellUI key={severity} className={cn(CELL_CLASS, "text-muted-foreground text-center")}>
              {PROTOTYPE_NO_VALUE}
            </TableCellUI>
          ))}
          <TableCellUI className={cn(CELL_CLASS, "text-muted-foreground text-center")}>
            {PROTOTYPE_NO_VALUE}
          </TableCellUI>
          <TableCellUI className={cn(CELL_CLASS, "text-muted-foreground")}>{PROTOTYPE_NO_VALUE}</TableCellUI>
          <TableCellUI className={CELL_CLASS} />
        </TableRowUI>
      )}
      {level.state === "data" &&
        level.targets.flatMap((target) =>
          target.tests.map((test) => (
            <ScanRows
              key={test.id}
              target={target}
              test={test}
              model={model}
              focused={target.environment !== null && isFocusedEnvironment(target.environment, focus)}
              expanded={expanded.has(test.id)}
              onToggle={() => onToggle(test.id)}
            />
          ))
        )}
    </>
  );
}

interface ScanRowsProps {
  target: ScanTarget;
  test: PrototypeDefectDojoTest;
  model: CodebaseFindingsModel;
  /** The row belongs to the Environment in focus. */
  focused: boolean;
  expanded: boolean;
  onToggle: () => void;
}

function ScanRows({ target, test, model, focused, expanded, onToggle }: ScanRowsProps) {
  const [severity, setSeverity] = React.useState<PrototypeDefectDojoSeverity | undefined>(undefined);
  const counts = testCounts(model.counts, test.id);
  const inactiveTotal = model.counts.get(test.id)?.inactiveTotal ?? null;
  const where = target.environment ? environmentLabel(target.environment) : (target.branch ?? PROTOTYPE_NO_VALUE);

  return (
    <>
      <TableRowUI
        data-testid={`scan-row-${test.id}`}
        data-focused={focused || undefined}
        className={cn(focused && "bg-primary/5 ring-primary ring-1 ring-inset")}
      >
        <TableCellUI className={CELL_CLASS}>
          <button
            type="button"
            aria-expanded={expanded}
            aria-label={`${expanded ? "Hide" : "Show"} findings of ${testLabel(test)}, ${target.title}`}
            onClick={onToggle}
            className="hover:bg-input focus-visible:ring-ring rounded p-1 focus-visible:ring-2 focus-visible:outline-none"
          >
            {expanded ? (
              <ChevronDown className="size-4" aria-hidden />
            ) : (
              <ChevronRight className="size-4" aria-hidden />
            )}
          </button>
        </TableCellUI>
        <TableCellUI className={CELL_CLASS}>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium break-all">{testLabel(test)}</span>
              {counts?.total === 0 && <CleanScanBadge />}
            </span>
            {target.level !== "runtime" && (
              <span className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs break-all">
                {target.title}
                {target.level === "image" && (
                  <Badge variant={target.ownImage ? "info" : "neutral"}>
                    {target.ownImage ? "Own image" : "Third-party image"}
                  </Badge>
                )}
              </span>
            )}
            {target.level === "runtime" && (
              <span className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs break-all">
                Workload {target.workload ?? PROTOTYPE_NO_VALUE}, container {target.container ?? PROTOTYPE_NO_VALUE}
                {target.notRunning && <Badge variant="neutral">Not running</Badge>}
              </span>
            )}
          </div>
        </TableCellUI>
        <TableCellUI className={cn(CELL_CLASS, "text-xs break-words")}>{where}</TableCellUI>
        <TableCellUI className={cn(CELL_CLASS, "text-xs break-all")}>
          {target.version || PROTOTYPE_NO_VALUE}
        </TableCellUI>
        {PROTOTYPE_SEVERITY_KEYS.map(({ severity: name, key }) => (
          <TableCellUI key={name} className={cn(CELL_CLASS, "text-center")}>
            <SeverityCountChip severity={name} count={counts ? counts[key] : null} />
          </TableCellUI>
        ))}
        <TableCellUI className={cn(CELL_CLASS, "text-muted-foreground text-center text-xs")}>
          {inactiveTotal ?? PROTOTYPE_NO_VALUE}
        </TableCellUI>
        <TableCellUI className={cn(CELL_CLASS, "text-muted-foreground text-xs")}>
          {formatScanTime(test.updated)}
        </TableCellUI>
        <TableCellUI className={CELL_CLASS}>
          <DefectDojoLink href={test.url} label={`Test ${test.id}`} />
        </TableCellUI>
      </TableRowUI>
      {expanded && (
        <TableRowUI className="hover:bg-transparent">
          <TableCellUI className="bg-muted/30 p-3" colSpan={COLUMN_COUNT}>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-4">
                <SeverityFilter value={severity} onChange={setSeverity} />
                <span className="text-muted-foreground text-xs">
                  Triaged findings are listed dimmed, with their state.
                </span>
                <div className="ml-auto flex items-center gap-3">
                  <DefectDojoLink href={test.engagement.url} label={`Engagement ${test.engagement.name}`}>
                    Engagement
                  </DefectDojoLink>
                  <DefectDojoLink href={test.product.url} label={`Product ${test.product.name}`}>
                    Product
                  </DefectDojoLink>
                </div>
              </div>
              <FindingsTable
                testId={test.id}
                triaged="show"
                severity={severity}
                caption={`Findings of ${testLabel(test)}, ${target.title}`}
              />
            </div>
          </TableCellUI>
        </TableRowUI>
      )}
    </>
  );
}
