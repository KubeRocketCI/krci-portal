import { isHistoryRecord } from "../../../../../../tektonResults/annotations.js";
import { PipelineRun } from "../../types.js";

export const isHistoryPipelineRun = (pipelineRun: PipelineRun): boolean => isHistoryRecord(pipelineRun);
