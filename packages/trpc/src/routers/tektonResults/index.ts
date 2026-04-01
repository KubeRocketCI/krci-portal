import { t } from "../../trpc.js";
import {
  listTektonResultsProcedure,
  listTektonRecordsProcedure,
  getTektonResultPipelineRunProcedure,
  getPipelineRunLogsProcedure,
  getSummaryProcedure,
  getTaskListProcedure,
  getTaskRunLogsProcedure,
  getTaskRunRecordsProcedure,
  getPipelineRunResultsProcedure,
} from "./procedures/index.js";

export const tektonResultsRouter = t.router({
  listResults: listTektonResultsProcedure,
  listRecords: listTektonRecordsProcedure,
  getPipelineRun: getTektonResultPipelineRunProcedure,
  getPipelineRunLogs: getPipelineRunLogsProcedure,
  getTaskList: getTaskListProcedure,
  getTaskRunLogs: getTaskRunLogsProcedure,
  getTaskRunRecords: getTaskRunRecordsProcedure,
  getPipelineRunResults: getPipelineRunResultsProcedure,
  getSummary: getSummaryProcedure,
});
