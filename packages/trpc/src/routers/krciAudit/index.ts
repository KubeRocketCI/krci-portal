import { t } from "../../trpc.js";
import { getTriggeredBy } from "./procedures/index.js";

export const krciAuditRouter = t.router({
  getTriggeredBy,
});
