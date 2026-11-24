import { z } from "zod";
import { VIEW_MODES } from "@/core/providers/ViewMode/types";

export const WORKER_POOLS_VIEW_ENTITY_ID = "agentWorkerPools";

export const workerPoolsSearchSchema = z.object({
  view: z.enum([VIEW_MODES.GRID, VIEW_MODES.TABLE]).optional().catch(undefined),
});

/** Search of a link to the workers: the cards, whatever view is saved. */
export const WORKERS_SEARCH = { view: VIEW_MODES.GRID } as const;
