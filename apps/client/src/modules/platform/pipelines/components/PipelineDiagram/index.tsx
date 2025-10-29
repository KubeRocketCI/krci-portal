import React from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Node,
  ConnectionLineType,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Pipeline } from "@my-project/shared";
import { usePipelineGraphData } from "./hooks/usePipelineGraphData";
import { PipelineTaskNode } from "./components/PipelineTaskNode";
import { usePipelineWatchItem } from "@/k8s/api/groups/Tekton/Pipeline";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";

export interface PipelineDiagramProps {
  pipeline: Pipeline;
}

const nodeTypes = {
  taskNode: PipelineTaskNode,
};

const PipelineDiagramInner: React.FC<PipelineDiagramProps> = ({ pipeline }) => {
  const [viewMode, setViewMode] = React.useState<"vertical" | "horizontal">("horizontal"); // Default to horizontal
  const direction = viewMode === "horizontal" ? "LR" : "TB";
  const { nodes, edges } = usePipelineGraphData(pipeline, direction);
  const { fitView } = useReactFlow();

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(nodes);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(edges);

  // Update nodes and edges when they change, and fit view
  React.useEffect(() => {
    setFlowNodes(nodes);
    setFlowEdges(edges);

    // Fit view when nodes/edges change (new pipeline loaded or viewMode changed)
    const timer = setTimeout(() => {
      fitView({
        padding: 0.15,
        duration: 300, // Smooth transition
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [nodes, edges, setFlowNodes, setFlowEdges, fitView]);

  return (
    <div
      className="h-full w-full relative"
    >
      {/* View Mode Toggle */}
      <div
        className="absolute top-4 right-4 z-50 bg-background rounded p-4 shadow-sm"
      >
        <span className="text-xs block mb-1">
          Layout
        </span>
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
      </div>

      {/* React Flow */}
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        defaultEdgeOptions={{
          type: "smoothstep",
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
          },
          style: {
            strokeWidth: 2,
          },
          animated: true,
        }}
        fitView
        fitViewOptions={{
          padding: 0.15, // Reduced padding for tighter fit
        }}
        minZoom={0.1}
        maxZoom={2}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        selectNodesOnDrag={false}
        onSelectionChange={() => {}} // Prevent selection
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeStrokeWidth={3}
          nodeColor={(node: Node) => {
            if (node.type === "taskNode") {
              return "#1976d2";
            }
            return "#9ca3af";
          }}
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
};

export const PipelineDiagram: React.FC<{ pipelineName: string; namespace: string }> = ({ pipelineName, namespace }) => {
  const pipelineWatch = usePipelineWatchItem({
    name: pipelineName,
    namespace,
  });

  const pipeline = pipelineWatch.query.data;

  return (
    <ReactFlowProvider>
      <LoadingWrapper isLoading={!pipelineWatch.isReady}>
        <PipelineDiagramInner pipeline={pipeline!} />
      </LoadingWrapper>
    </ReactFlowProvider>
  );
};
