import { t } from "../../trpc.js";
import { getTriggeredBy, getAuditEvents, getAuditFacets } from "./procedures/index.js";

export const krciAuditRouter = t.router({
  getTriggeredBy,
  getAuditEvents,
  getAuditFacets,
});
