import React from "react";
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
import { ToggleButton, ToggleButtonGroup } from "@/core/components/ui/toggle-button-group";
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
          fitView({ padding: 0.15, maxZoom: 1, duration: 200 });
        }, 50);
      } else if (!hasValidSize) {
        // Container became hidden (e.g., tab switch away) - reset for next visibility
        hasVisibleSizeRef.current = false;
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [fitView]);

  return (
    <div ref={containerRef} className="relative h-full w-full flex-1">
      {/* View Mode Toggle */}
      <div className="bg-background absolute top-4 right-4 z-50 rounded p-4 shadow-sm">
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
      <div className="flex h-full w-full flex-1 flex-col">
        <LoadingWrapper isLoading={!pipelineWatch.isReady}>
          <PipelineDiagramInner pipeline={pipeline!} />
        </LoadingWrapper>
      </div>
    </ReactFlowProvider>
  );
};
