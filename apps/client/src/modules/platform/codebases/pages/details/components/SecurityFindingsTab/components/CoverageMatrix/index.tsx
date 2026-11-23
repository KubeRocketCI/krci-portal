import React from "react";
import {
  CODEBASE_SCAN_LEVELS,
  DEFECTDOJO_SEVERITIES,
  type CodebaseFindings,
  type CodebaseFindingsInput,
} from "@my-project/shared";
import { Card } from "@/core/components/ui/card";
import { TableHeadUI, TableHeaderUI, TableRowUI, TableUI } from "@/core/components/ui/table";
import { cn } from "@/core/utils/classname";
import { HEAD_CLASS } from "@/modules/platform/security/components/defectdojo/constants";
import { LevelSection } from "../LevelSection";

type CoverageMatrixData = Extract<CodebaseFindings, { state: "data" }>;

export interface CoverageMatrixProps {
  levels: CoverageMatrixData["levels"];
  codebase: CodebaseFindingsInput;
}

/** One table of every scan of the codebase, in a section per level; a row is one scan. */
export function CoverageMatrix({ levels, codebase }: CoverageMatrixProps) {
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
      <TableUI aria-label={`Security scans of ${codebase.name}`}>
        <TableHeaderUI>
          <TableRowUI>
            <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-10")}>
              <span className="sr-only">Expand</span>
            </TableHeadUI>
            <TableHeadUI scope="col" className={HEAD_CLASS}>
              Scan
            </TableHeadUI>
            <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-32")}>
              Branch
            </TableHeadUI>
            <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-44")}>
              Image tag
            </TableHeadUI>
            {DEFECTDOJO_SEVERITIES.map((severity) => (
              <TableHeadUI key={severity} scope="col" className={cn(HEAD_CLASS, "w-16 text-center")}>
                {severity}
              </TableHeadUI>
            ))}
            <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-16 text-center")}>
              Triaged
            </TableHeadUI>
            <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-40")}>
              Last upload
            </TableHeadUI>
            <TableHeadUI scope="col" className={cn(HEAD_CLASS, "w-12")}>
              <span className="sr-only">DefectDojo</span>
            </TableHeadUI>
          </TableRowUI>
        </TableHeaderUI>
        {CODEBASE_SCAN_LEVELS.map((level) => (
          <LevelSection
            key={level}
            level={level}
            data={levels[level]}
            codebase={codebase}
            expanded={expanded}
            onToggle={toggle}
          />
        ))}
      </TableUI>
    </Card>
  );
}
