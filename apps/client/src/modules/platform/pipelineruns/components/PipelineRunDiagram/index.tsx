import { useApprovalTaskWatchList } from "@/k8s/api/groups/KRCI/ApprovalTask";
import { getApprovalTaskStatusIcon } from "@/k8s/api/groups/KRCI/ApprovalTask/utils";
import { usePipelineRunWatchItem } from "@/k8s/api/groups/Tekton/PipelineRun";
import { useTaskWatchList } from "@/k8s/api/groups/Tekton/Task";
import { useTaskRunWatchList } from "@/k8s/api/groups/Tekton/TaskRun";
import { getTaskRunStatusIcon } from "@/k8s/api/groups/Tekton/TaskRun/utils";
import { ToggleButton, ToggleButtonGroup } from "@/core/components/ui/toggle-button-group";
import { approvalTaskLabels, PipelineRun, taskRunLabels } from "@my-project/shared";
import {
  Background,
  ConnectionLineType,
  Controls,
  MarkerType,
  MiniMap,
  NodeTypes,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import React from "react";
import { buildPipelineRunTasksByNameMap } from "../../pages/details/hooks/utils";
import { PipelineRunTaskNode } from "./components/PipelineRunTaskNode";
import { PipelineRunTaskCombinedData, usePipelineRunGraphData } from "./hooks/usePipelineRunGraphData";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";

const nodeTypes = {
  taskNode: PipelineRunTaskNode,
} as NodeTypes;

const PipelineRunDiagramDataWrapper: React.FC<{
  pipelineRunName: string;
  namespace: string;
}> = ({ pipelineRunName, namespace }) => {
  const pipelineRunWatch = usePipelineRunWatchItem({
    name: pipelineRunName,
    namespace,
  });

  const taskRunsWatch = useTaskRunWatchList({
    namespace,
    labels: {
      [taskRunLabels.parentPipelineRun]: pipelineRunName,
    },
  });

  const tasksWatch = useTaskWatchList({
    namespace,
  });

  const approvalTasksWatch = useApprovalTaskWatchList({
    namespace,
    labels: {
      [approvalTaskLabels.parentPipelineRun]: pipelineRunName,
    },
  });

  const pipelineRun = pipelineRunWatch.query.data as PipelineRun | undefined;

  const pipelineRunTasks = React.useMemo(() => {
    const mainTasks = pipelineRun?.status?.pipelineSpec?.tasks || [];
    const finallyTasks = pipelineRun?.status?.pipelineSpec?.finally || [];

    return {
      allTasks: [...mainTasks, ...finallyTasks],
      mainTasks,
      finallyTasks,
    };
  }, [pipelineRun]);

  const pipelineRunTasksByNameMap = React.useMemo(() => {
    return buildPipelineRunTasksByNameMap({
      allPipelineTasks: pipelineRunTasks.allTasks,
      tasks: tasksWatch.data.array,
      taskRuns: taskRunsWatch.data.array,
      approvalTasks: approvalTasksWatch.data.array,
    });
  }, [pipelineRunTasks.allTasks, tasksWatch.data.array, taskRunsWatch.data.array, approvalTasksWatch.data.array]);

  const isLoading =
    pipelineRunWatch.isLoading || tasksWatch.isLoading || taskRunsWatch.isLoading || approvalTasksWatch.isLoading;

  return (
    <div className="flex h-full w-full flex-1 flex-col">
      <LoadingWrapper isLoading={isLoading}>
        <PipelineRunDiagramView pipelineRun={pipelineRun!} pipelineRunTasksByNameMap={pipelineRunTasksByNameMap} />
      </LoadingWrapper>
    </div>
  );
};

const PipelineRunDiagramView: React.FC<{
  pipelineRun: PipelineRun;
  pipelineRunTasksByNameMap: Map<string, PipelineRunTaskCombinedData>;
}> = ({ pipelineRun, pipelineRunTasksByNameMap }) => {
  const [viewMode, setViewMode] = React.useState<"vertical" | "horizontal">("horizontal");
  const direction = viewMode === "horizontal" ? "LR" : "TB";
  const { nodes, edges } = usePipelineRunGraphData(pipelineRun, pipelineRunTasksByNameMap, direction);
  const { fitView } = useReactFlow();
  const containerRef = React.useRef<HTMLDivElement>(null);

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(nodes);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(edges);

  // Track visibility without causing re-renders
  const hasVisibleSizeRef = React.useRef(false);

  // Update nodes and edges when they change
  React.useEffect(() => {
    setFlowNodes(nodes);
    setFlowEdges(edges);
  }, [nodes, edges, setFlowNodes, setFlowEdges]);

  // Detect when container becomes visible (has non-zero dimensions) and fit view
  // Using ResizeObserver - the standard Web API for detecting element size changes
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const hasValidSize = entry && entry.contentRect.width > 0 && entry.contentRect.height > 0;

      if (hasValidSize && !hasVisibleSizeRef.current) {
        hasVisibleSizeRef.current = true;
        // Small delay to ensure ReactFlow has processed the resize
        // This is necessary because ReactFlow's internal resize handling is async
        setTimeout(() => {
          fitView({ padding: 0.1, maxZoom: 1, duration: 200 });
        }, 50);
      } else if (!hasValidSize) {
        // Container became hidden (e.g., tab switch away) - reset for next visibility
        hasVisibleSizeRef.current = false;
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [fitView]);

  // Apply edge colors based on target node status
  const coloredEdges = React.useMemo(() => {
    return flowEdges.map((edge) => {
      if (edge.hidden) return edge;

      const targetNode = flowNodes.find((node) => node.id === edge.target);
      if (!targetNode) return edge;

      // Get status color from target node
      let statusColor = "#666"; // default gray

      if (targetNode.data.approvalTask) {
        const statusData = getApprovalTaskStatusIcon(targetNode.data.approvalTask);
        statusColor = statusData.color;
      } else if (targetNode.data.taskRun) {
        const statusData = getTaskRunStatusIcon(targetNode.data.taskRun);
        statusColor = statusData.color;
      }

      return {
        ...edge,
        style: {
          ...edge.style,
          stroke: statusColor,
          strokeWidth: 2,
          strokeDasharray: "5,5",
          animation: "dashdraw 0.5s linear infinite",
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: statusColor,
          width: 20,
          height: 20,
        },
      };
    });
  }, [flowEdges, flowNodes]);

  return (
    <div ref={containerRef} className="relative h-full w-full flex-1">
      {/* Layout Controls */}
      <div
        className="bg-background absolute top-4 right-4 z-[1000] rounded-md p-4 shadow-md"
        style={
          {
            // Prevent node selection highlighting
          }
        }
      >
        <span className="mb-1 block text-xs">Layout</span>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, newMode) => {
            if (newMode !== null) {
              setViewMode(newMode);
            }
          }}
          size="sm"
        >
          <ToggleButton value="vertical">Vertical</ToggleButton>
          <ToggleButton value="horizontal">Horizontal</ToggleButton>
        </ToggleButtonGroup>
      </div>

      <ReactFlow
        nodes={flowNodes}
        edges={coloredEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        defaultEdgeOptions={{
          type: "smoothstep",
          style: {
            strokeDasharray: "5,5",
            animation: "dashdraw 0.5s linear infinite",
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
          },
        }}
        fitView
        fitViewOptions={{
          padding: 0.1,
          maxZoom: 1,
        }}
        minZoom={0.1}
        maxZoom={2}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        selectNodesOnDrag={false}
        onSelectionChange={() => {}}
        panOnDrag={true}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls showInteractive={false} />
        <MiniMap
          nodeStrokeWidth={3}
          pannable
          zoomable
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.8)",
          }}
        />
      </ReactFlow>
    </div>
  );
};

export const PipelineRunDiagram: React.FC<{ pipelineRunName: string; namespace: string }> = ({
  pipelineRunName,
  namespace,
}) => {
  return (
    <ReactFlowProvider>
      <PipelineRunDiagramDataWrapper pipelineRunName={pipelineRunName} namespace={namespace} />
    </ReactFlowProvider>
  );
};
