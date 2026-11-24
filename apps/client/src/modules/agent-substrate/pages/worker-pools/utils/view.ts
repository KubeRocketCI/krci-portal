import { VIEW_MODES, type ViewMode } from "@/core/providers/ViewMode/types";
import { isWorkerAnchor } from "../../../utils/rowAnchor";

export type WorkerPoolsView = typeof VIEW_MODES.GRID | typeof VIEW_MODES.TABLE;

/**
 * Only the cards show workers: a hash that names a worker gives cards. `requested`, the `view` search param, comes
 * next. Neither changes the saved view.
 */
export function workerPoolsView(saved: ViewMode, hash: string, requested?: WorkerPoolsView): WorkerPoolsView {
  if (isWorkerAnchor(hash)) return VIEW_MODES.GRID;
  if (requested) return requested;
  return saved === VIEW_MODES.TABLE ? VIEW_MODES.TABLE : VIEW_MODES.GRID;
}
