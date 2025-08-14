import { t } from "../..";
import {
  getPipelineRunLogsProcedure,
  getDepTrackProjectMetricsProcedure,
  getDepTrackProjectProcedure,
  getAllPipelineRunsLogsProcedure,
} from "./procedures";

export const krakendRouter = t.router({
  getPipelineRunLogs: getPipelineRunLogsProcedure,
  getAllPipelineRunsLogs: getAllPipelineRunsLogsProcedure,
  getDepTrackProject: getDepTrackProjectProcedure,
  getDepTrackProjectMetrics: getDepTrackProjectMetricsProcedure,
});
