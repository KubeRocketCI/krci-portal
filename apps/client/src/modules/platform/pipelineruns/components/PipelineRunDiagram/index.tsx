import { useApprovalTaskWatchList } from "@/k8s/api/groups/KRCI/ApprovalTask";
import { getApprovalTaskStatusIcon } from "@/k8s/api/groups/KRCI/ApprovalTask/utils";
import { usePipelineRunWatchItem } from "@/k8s/api/groups/Tekton/PipelineRun";
import { useTaskWatchList } from "@/k8s/api/groups/Tekton/Task";
import { useTaskRunWatchList } from "@/k8s/api/groups/Tekton/TaskRun";
import { getTaskRunStatusIcon } from "@/k8s/api/groups/Tekton/TaskRun/utils";
import { Box, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
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
    <LoadingWrapper isLoading={isLoading}>
      <PipelineRunDiagramView pipelineRun={pipelineRun!} pipelineRunTasksByNameMap={pipelineRunTasksByNameMap} />
    </LoadingWrapper>
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

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(nodes);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(edges);

  const [hasInitialized, setHasInitialized] = React.useState(false);

  // Update nodes and edges when they change
  React.useEffect(() => {
    setFlowNodes(nodes);
    setFlowEdges(edges);

    // Only fit view on initial load, not on data updates
    if (!hasInitialized && nodes.length > 0) {
      const timer = setTimeout(() => {
        fitView({ padding: 0.1, maxZoom: 1, duration: 200 });
        setHasInitialized(true);
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [nodes, edges, setFlowNodes, setFlowEdges, fitView, hasInitialized]);

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
    <Box
      sx={{
        height: "100%",
        width: "100%",
        position: "relative",
        "& .react-flow__node.selected": {
          "& .react-flow__node-default": {
            boxShadow: "none !important",
          },
        },
        "& .react-flow__edge-path": {
          strokeDasharray: "5,5",
          animation: "dashdraw 0.5s linear infinite",
        },
        "@keyframes dashdraw": {
          "0%": {
            strokeDashoffset: "10",
          },
          "100%": {
            strokeDashoffset: "0",
          },
        },
      }}
    >
      {/* Layout Controls */}
      <Box
        sx={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 1000,
          backgroundColor: "background.paper",
          borderRadius: 1,
          p: 1,
          boxShadow: 1,
        }}
      >
        <Typography variant="caption" sx={{ mb: 1, display: "block" }}>
          Layout
        </Typography>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, newMode) => {
            if (newMode !== null) {
              setViewMode(newMode);
            }
          }}
          size="small"
        >
          <ToggleButton value="vertical">Vertical</ToggleButton>
          <ToggleButton value="horizontal">Horizontal</ToggleButton>
        </ToggleButtonGroup>
      </Box>

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
    </Box>
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
