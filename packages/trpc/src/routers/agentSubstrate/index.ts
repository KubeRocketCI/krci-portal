import { t } from "../../trpc.js";
import { getFleet } from "./procedures/index.js";

export const agentSubstrateRouter = t.router({
  getFleet,
});
