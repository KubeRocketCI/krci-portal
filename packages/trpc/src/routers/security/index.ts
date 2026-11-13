import { t } from "../../trpc.js";
import { getCodebaseSummaryProcedure } from "./procedures/getCodebaseSummary/index.js";
import { getEnvironmentSummaryProcedure } from "./procedures/getEnvironmentSummary/index.js";
import { listFindingsProcedure } from "./procedures/listFindings/index.js";

export const securityRouter = t.router({
  getCodebaseSummary: getCodebaseSummaryProcedure,
  getEnvironmentSummary: getEnvironmentSummaryProcedure,
  listFindings: listFindingsProcedure,
});
