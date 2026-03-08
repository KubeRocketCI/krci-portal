import CodeEditor from "@/core/components/CodeEditor";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { Card } from "@/core/components/ui/card";
import { usePipelineRunContext } from "../../providers/PipelineRun/hooks";

/**
 * Unified YAML view component.
 * Displays the PipelineRun as YAML/JSON from context data (works for both live and history).
 */
export function ViewPipelineRun() {
  const { pipelineRun, isLoading } = usePipelineRunContext();

  if (!pipelineRun) {
    return <LoadingWrapper isLoading={isLoading}>{null}</LoadingWrapper>;
  }

  return (
    <LoadingWrapper isLoading={isLoading}>
      <Card className="h-full overflow-hidden">
        <CodeEditor content={pipelineRun} />
      </Card>
    </LoadingWrapper>
  );
}
