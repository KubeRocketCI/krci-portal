import { t } from "../../trpc.js";
import { getAgent, getFleet } from "./procedures/index.js";

export const agentSubstrateRouter = t.router({
  getFleet,
  getAgent,
});
