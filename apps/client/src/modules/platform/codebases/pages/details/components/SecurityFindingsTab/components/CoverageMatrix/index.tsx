import React from "react";
import { CODEBASE_SCAN_LEVELS, type CodebaseFindings, type CodebaseFindingsInput } from "@my-project/shared";
import { Card } from "@/core/components/ui/card";
import { TableHeadUI, TableHeaderUI, TableRowUI, TableUI } from "@/core/components/ui/table";
import { cn } from "@/core/utils/classname";
import { HEAD_CLASS } from "@/modules/platform/security/components/defectdojo/constants";
import { SeverityHeadCells } from "@/modules/platform/security/components/defectdojo/SeverityCountCells";
import type { SecurityFindingsFocus } from "../../types";
import { LevelSection } from "../LevelSection";
import { RuntimeSection } from "../RuntimeSection";

type CoverageMatrixData = Extract<CodebaseFindings, { state: "data" }>;

export interface CoverageMatrixProps {
  levels: CoverageMatrixData["levels"];
  codebase: CodebaseFindingsInput;
  focus: SecurityFindingsFocus | null;
}

/**
 * One table of every scan of the codebase, in a section per level; a row is one scan, or one container of an
 * Environment at the Runtime level.
 */
export function CoverageMatrix({ levels, codebase, focus }: CoverageMatrixProps) {
  const [expanded, setExpanded] = React.useState<ReadonlySet<string>>(new Set());

  const toggle = (key: string) => {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (!next.delete(key)) {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <Card className="p-0">
      <TableUI aria-label={`Security scans of ${codebase.name}`} className="min-w-[69rem]">
        <TableHeaderUI>
          <TableRowUI>
            <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-10")}>
              <span className="sr-only">Expand</span>
            </TableHeadUI>
            <TableHeadUI scope="col" className={HEAD_CLASS}>
              Scan
            </TableHeadUI>
            <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-40")}>
              Branch / Environment
            </TableHeadUI>
            <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-44")}>
              Image tag
            </TableHeadUI>
            <SeverityHeadCells />
            <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-16 text-center")}>
              Triaged
            </TableHeadUI>
            <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-40")}>
              Last upload
            </TableHeadUI>
            <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-14")}>
              <span className="sr-only">DefectDojo</span>
            </TableHeadUI>
          </TableRowUI>
        </TableHeaderUI>
        {CODEBASE_SCAN_LEVELS.map((level) => (
          <LevelSection
            key={level}
            level={level}
            data={levels[level]}
            runtime={levels.runtime}
            focus={focus}
            codebase={codebase}
            expanded={expanded}
            onToggle={toggle}
          />
        ))}
        <RuntimeSection data={levels.runtime} codebase={codebase} expanded={expanded} onToggle={toggle} focus={focus} />
      </TableUI>
    </Card>
  );
}
