import { tektonResultAnnotations } from "../../../../../../tektonResults/annotations.js";
import { PipelineRun } from "../../types.js";

/**
 * Check whether a PipelineRun was loaded from Tekton Results history
 * (as opposed to a live K8s watch).
 *
 * Both normalizers (`normalizeHistoryPipelineRun` and `normalizeResultToPipelineRun`)
 * stamp history items with the `historySource` annotation.
 */
export const isHistoryPipelineRun = (pipelineRun: PipelineRun): boolean =>
  pipelineRun.metadata.annotations?.[tektonResultAnnotations.historySource] === "true";
