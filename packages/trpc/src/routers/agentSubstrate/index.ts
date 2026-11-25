import { t } from "../../trpc.js";
import { getAgent, getAgentReviewRuns, getFleet } from "./procedures/index.js";

export const agentSubstrateRouter = t.router({
  getFleet,
  getAgent,
  getAgentReviewRuns,
});
