import { VIEW_MODES, type ViewMode } from "@/core/providers/ViewMode/types";

/** `GRID`: the view By codebase. */
export type AgentsView = typeof VIEW_MODES.TABLE | typeof VIEW_MODES.GRID;

export function agentsView(saved: ViewMode): AgentsView {
  return saved === VIEW_MODES.GRID ? VIEW_MODES.GRID : VIEW_MODES.TABLE;
}
