import { ResultsView } from "@/modules/platform/tekton/components/ResultsView";
import { usePipelineRunContext } from "../../providers/PipelineRun/hooks";

const EMPTY_RESULTS: Record<string, string>[] = [];

/**
 * Unified Results component.
 * Displays PipelineRun results from context data (works for both live and history).
 * Unlike the existing Results component, this does NOT call usePipelineRunWatchItem internally.
 */
export function Results() {
  const { pipelineRun } = usePipelineRunContext();
  const results = pipelineRun?.status?.results || EMPTY_RESULTS;

  return <ResultsView results={results} />;
}
