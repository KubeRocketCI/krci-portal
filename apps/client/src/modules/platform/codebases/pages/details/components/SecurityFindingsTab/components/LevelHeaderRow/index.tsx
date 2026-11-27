import type { ReactNode } from "react";
import { TableHeadUI, TableRowUI } from "@/core/components/ui/table";
import type { LevelMeta } from "@/modules/platform/security/components/defectdojo/constants";
import { COLUMN_COUNT } from "../../constants";

export interface LevelHeaderRowProps {
  meta: LevelMeta;
  /** The state of the level, at the end of the row. */
  children?: ReactNode;
}

export function LevelHeaderRow({ meta, children }: LevelHeaderRowProps) {
  const Icon = meta.icon;

  return (
    <TableRowUI className="bg-input/40 hover:bg-input/40">
      <TableHeadUI scope="rowgroup" colSpan={COLUMN_COUNT} className="px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <Icon className="size-4 shrink-0" aria-hidden />
          <span className="text-foreground text-sm font-semibold">{meta.label}</span>
          <span className="text-muted-foreground text-xs font-normal">{meta.subject}</span>
          {children && <span className="ml-auto flex items-center gap-2 text-xs font-normal">{children}</span>}
        </div>
      </TableHeadUI>
    </TableRowUI>
  );
}
