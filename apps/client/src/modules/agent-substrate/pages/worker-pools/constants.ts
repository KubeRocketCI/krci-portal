import { LayoutGrid, List } from "lucide-react";
import { z } from "zod";
import { VIEW_MODES } from "@/core/providers/ViewMode/types";
import type { ViewToggleOption } from "../../components/ViewToggle";
import type { WorkerPoolsView } from "./utils/view";

export const WORKER_POOLS_VIEW_ENTITY_ID = "agentWorkerPools";

export const WORKER_POOLS_VIEW_OPTIONS: readonly ViewToggleOption<WorkerPoolsView>[] = [
  { value: VIEW_MODES.GRID, label: "Cards", icon: LayoutGrid },
  { value: VIEW_MODES.TABLE, label: "Table", icon: List },
];

export const workerPoolsSearchSchema = z.object({
  view: z.enum([VIEW_MODES.GRID, VIEW_MODES.TABLE]).optional().catch(undefined),
});

/** Search of a link to the workers: the cards, whatever view is saved. */
export const WORKERS_SEARCH = { view: VIEW_MODES.GRID } as const;
