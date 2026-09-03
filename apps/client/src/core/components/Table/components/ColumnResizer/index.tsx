import { ColumnResizerProps } from "./types";

export const COLUMN_RESIZER_SLOT = "column-resizer";

/**
 * Drag handle for a column edge. Positioned against the `relative` `<th>` it sits in.
 * `aria-hidden`, not focusable: pointer only, no keyboard resize. The `w-3` hit area is
 * centred on the column boundary. The inner line is `pointer-events-none`.
 */
export const ColumnResizer = ({ onPointerDown, onDoubleClick }: ColumnResizerProps) => (
  <span
    aria-hidden="true"
    data-slot={COLUMN_RESIZER_SLOT}
    onPointerDown={onPointerDown}
    onDoubleClick={onDoubleClick}
    className="group/resizer absolute inset-y-0 right-0 z-10 flex w-3 translate-x-1/2 cursor-col-resize touch-none items-center justify-center select-none"
  >
    <span className="bg-border group-hover/resizer:bg-primary group-active/resizer:bg-primary pointer-events-none h-3/5 w-px transition-colors group-hover/resizer:w-0.5 group-active/resizer:w-0.5" />
  </span>
);
