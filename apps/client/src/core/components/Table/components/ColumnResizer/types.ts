import React from "react";

/** Bound handlers produced by `useColumnResize` for one column. */
export interface ColumnResizerProps {
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
  onDoubleClick: () => void;
}
