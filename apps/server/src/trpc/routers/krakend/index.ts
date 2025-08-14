import { t } from "../..";
import {
  getPipelineRunLogsProcedure,
  getDepTrackProjectMetricsProcedure,
  getDepTrackProjectProcedure,
} from "./procedures";

export const krakendRouter = t.router({
  getPipelineRunLogs: getPipelineRunLogsProcedure,
  getDepTrackProject: getDepTrackProjectProcedure,
  getDepTrackProjectMetrics: getDepTrackProjectMetricsProcedure,
});
