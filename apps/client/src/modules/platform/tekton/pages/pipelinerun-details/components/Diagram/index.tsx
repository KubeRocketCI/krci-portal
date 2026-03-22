import { Card } from "@/core/components/ui/card";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { PipelineRunDiagramView } from "@/modules/platform/tekton/components/PipelineRunDiagram";
import { ReactFlowProvider } from "@xyflow/react";
import { usePipelineRunContext } from "../../providers/PipelineRun/hooks";
import { routePipelineRunDetails } from "../../route";

/**
 * Unified Diagram component.
 *
 * Uses PipelineRunDiagramView with context data for both live and history branches.
 * This avoids duplicate K8s watches that PipelineRunDiagram would create for live data.
 */
export function Diagram() {
  const params = routePipelineRunDetails.useParams();
  const { pipelineRun, pipelineRunTasks, pipelineRunTasksByNameMap, isLoading } = usePipelineRunContext();

  const hasDiagramData = !!pipelineRun && pipelineRunTasks.allTasks.length > 0;

  return (
    <Card className="flex h-[var(--content-height)] w-full flex-col">
      <LoadingWrapper isLoading={isLoading}>
        {hasDiagramData ? (
          <ReactFlowProvider>
            <PipelineRunDiagramView
              pipelineRun={pipelineRun}
              pipelineRunTasksByNameMap={pipelineRunTasksByNameMap}
              namespace={params.namespace}
            />
          </ReactFlowProvider>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground text-sm">No diagram data available for this pipeline run.</p>
          </div>
        )}
      </LoadingWrapper>
    </Card>
  );
}
