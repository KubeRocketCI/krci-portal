import { t } from "../../trpc.js";
import {
  listTektonResultsProcedure,
  getTektonResultPipelineRunProcedure,
  getPipelineRunLogsProcedure,
} from "./procedures/index.js";

export const tektonResultsRouter = t.router({
  listResults: listTektonResultsProcedure,
  getPipelineRun: getTektonResultPipelineRunProcedure,
  getPipelineRunLogs: getPipelineRunLogsProcedure,
});
