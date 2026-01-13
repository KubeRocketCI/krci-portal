import { t } from "../../trpc.js";
import {
  listTektonResultsProcedure,
  getTektonResultPipelineRunProcedure,
  getPipelineRunLogsProcedure,
  getSummaryProcedure,
  getTaskListProcedure,
  getTaskRunLogsProcedure,
} from "./procedures/index.js";

export const tektonResultsRouter = t.router({
  listResults: listTektonResultsProcedure,
  getPipelineRun: getTektonResultPipelineRunProcedure,
  getPipelineRunLogs: getPipelineRunLogsProcedure,
  getTaskList: getTaskListProcedure,
  getTaskRunLogs: getTaskRunLogsProcedure,
  getSummary: getSummaryProcedure,
});
