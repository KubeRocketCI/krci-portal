import { t } from "../../trpc.js";
import {
  listTektonResultsProcedure,
  getTektonResultPipelineRunProcedure,
  getPipelineRunLogsProcedure,
  getSummaryProcedure,
} from "./procedures/index.js";

export const tektonResultsRouter = t.router({
  listResults: listTektonResultsProcedure,
  getPipelineRun: getTektonResultPipelineRunProcedure,
  getPipelineRunLogs: getPipelineRunLogsProcedure,
  getSummary: getSummaryProcedure,
});
