import React from "react";
import {
  Background,
  ConnectionLineType,
  Controls,
  MarkerType,
  MiniMap,
  Node,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesInitialized,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Card, CardContent } from "@/core/components/ui/card";
import { ToggleButton, ToggleButtonGroup } from "@/core/components/ui/toggle-button-group";
import { Label } from "@/core/components/ui/label";
import { EventListenerTopology } from "@/modules/platform/tekton/hooks/useEventListenerTopology";
import { GitSourceNode } from "./components/GitSourceNode";
import { EventListenerNode } from "./components/EventListenerNode";
import { TriggerNode } from "./components/TriggerNode";
import { InterceptorNode } from "./components/InterceptorNode";
import { TriggerBindingNode } from "./components/TriggerBindingNode";
import { TriggerTemplateNode } from "./components/TriggerTemplateNode";
import { PipelineNode } from "./components/PipelineNode";
import { EventFlowNodeDrawer } from "../EventFlowNodeDrawer";
import { DrawerSelection } from "../EventFlowNodeDrawer/types";
import { FlowNode, useEventFlowGraphData } from "./hooks/useEventFlowGraphData";
import { getLayoutedElements } from "./utils/layoutUtils";
import { LEGEND_LABELS, NODE_KIND, NODE_KIND_CSS_VAR, NODE_KIND_TAILWIND, NodeKind } from "./constants";

const nodeTypes = {
  [NODE_KIND.GIT_SOURCE]: GitSourceNode,
  [NODE_KIND.EVENT_LISTENER]: EventListenerNode,
  [NODE_KIND.TRIGGER]: TriggerNode,
  [NODE_KIND.INTERCEPTOR]: InterceptorNode,
  [NODE_KIND.TRIGGER_BINDING]: TriggerBindingNode,
  [NODE_KIND.TRIGGER_TEMPLATE]: TriggerTemplateNode,
  [NODE_KIND.PIPELINE]: PipelineNode,
};

const readCssVar = (name: string): string => {
  if (typeof window === "undefined") return "#9ca3af";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#9ca3af";
};

const isNodeKind = (s: string): s is NodeKind => s in NODE_KIND_CSS_VAR;

const miniMapNodeColor = (node: Node): string => {
  const t = node.type ?? "";
  return readCssVar(isNodeKind(t) ? NODE_KIND_CSS_VAR[t] : "--muted-foreground");
};

const nodeToSelection = (node: FlowNode, topology: EventListenerTopology): DrawerSelection | null => {
  const ns = topology.eventListener.metadata.namespace ?? "";
  switch (node.type) {
    case NODE_KIND.GIT_SOURCE:
      return { kind: "gitSource", gitServer: topology.gitServer };
    case NODE_KIND.EVENT_LISTENER:
      return { kind: "eventListener", eventListener: topology.eventListener };
    case NODE_KIND.TRIGGER:
      return {
        kind: "trigger",
        triggerRef: node.data.triggerRef,
        resolved: node.data.resolved,
        status: node.data.status,
        namespace: ns,
      };
    case NODE_KIND.INTERCEPTOR:
      return { kind: "interceptor", interceptor: node.data.interceptor, namespace: ns };
    case NODE_KIND.TRIGGER_BINDING:
      return { kind: "triggerBinding", binding: node.data.binding, namespace: ns };
    case NODE_KIND.TRIGGER_TEMPLATE:
      return { kind: "triggerTemplate", template: node.data.template, namespace: ns };
    case NODE_KIND.PIPELINE:
      return {
        kind: "pipeline",
        pipelineRef: node.data.pipelineRef,
        latestPipelineRun: node.data.latestPipelineRun,
        namespace: ns,
      };
    default:
      return null;
  }
};

const Inner: React.FC<{ topology: EventListenerTopology }> = ({ topology }) => {
  const [direction, setDirection] = React.useState<"LR" | "TB">("LR");
  const [selection, setSelection] = React.useState<DrawerSelection | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const onNodeClick = React.useCallback(
    (_: React.MouseEvent, node: FlowNode) => {
      const sel = nodeToSelection(node, topology);
      if (sel) {
        setSelection(sel);
        setDrawerOpen(true);
      }
    },
    [topology]
  );

  const { nodes, edges } = useEventFlowGraphData(topology, direction);
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState<FlowNode>(nodes);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(edges);
  const { fitView, getNodes } = useReactFlow<FlowNode>();
  const nodesInitialized = useNodesInitialized();
  const [layoutPhase, setLayoutPhase] = React.useState<"estimated" | "measured">("estimated");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const hasVisibleSizeRef = React.useRef(false);

  React.useEffect(() => {
    setLayoutPhase("estimated");
    setFlowNodes(nodes);
    setFlowEdges(edges);
  }, [nodes, edges, setFlowNodes, setFlowEdges]);

  // Once xyflow has measured every rendered node, re-run dagre using the real
  // widths/heights. This is the library's automatic measurement path: with
  // accurate sizes, smoothstep edges enter through the left/right handles
  // instead of bending into the node body when estimates underreport width.
  React.useEffect(() => {
    if (!nodesInitialized || layoutPhase === "measured") return;
    const measured = getNodes();
    if (!measured.length) return;
    if (measured.some((n) => !n.measured?.width || !n.measured?.height)) return;
    const result = getLayoutedElements(measured, edges, direction);
    setFlowNodes(result.nodes);
    setLayoutPhase("measured");
    const fitTimer = setTimeout(() => fitView({ padding: 0.15, maxZoom: 1, duration: 200 }), 50);
    return () => clearTimeout(fitTimer);
  }, [nodesInitialized, layoutPhase, getNodes, edges, direction, setFlowNodes, fitView]);

  React.useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const ro = new ResizeObserver((entries) => {
      const e = entries[0];
      const ok = !!e && e.contentRect.width > 0 && e.contentRect.height > 0;
      if (ok && !hasVisibleSizeRef.current) {
        hasVisibleSizeRef.current = true;
        setTimeout(() => fitView({ padding: 0.15, maxZoom: 1, duration: 200 }), 50);
      } else if (!ok) {
        hasVisibleSizeRef.current = false;
      }
    });
    ro.observe(c);
    return () => ro.disconnect();
  }, [fitView]);

  return (
    <div ref={containerRef} className="relative h-full w-full flex-1">
      <Card className="absolute top-4 left-4 z-10">
        <CardContent className="flex flex-wrap gap-2 p-3 text-xs">
          {(Object.keys(LEGEND_LABELS) as Array<keyof typeof LEGEND_LABELS>).map((kind) => (
            <span
              key={kind}
              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 ${NODE_KIND_TAILWIND[kind]}`}
            >
              <span className="inline-block size-2 rounded bg-current" />
              {LEGEND_LABELS[kind]}
            </span>
          ))}
        </CardContent>
      </Card>

      <Card className="absolute top-4 right-4 z-10">
        <CardContent className="flex flex-col gap-3 p-3">
          <div>
            <Label className="mb-1 block text-xs">Layout</Label>
            <ToggleButtonGroup
              aria-label="Graph layout direction"
              value={direction}
              exclusive
              onChange={(_, v) => v && setDirection(v)}
              size="sm"
            >
              <ToggleButton value="LR">Horizontal</ToggleButton>
              <ToggleButton value="TB">Vertical</ToggleButton>
            </ToggleButtonGroup>
          </div>
        </CardContent>
      </Card>

      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        defaultEdgeOptions={{
          type: "smoothstep",
          markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
          style: { strokeWidth: 1.5 },
          animated: false,
        }}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.1}
        maxZoom={2}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        selectNodesOnDrag={false}
        proOptions={{ hideAttribution: true }}
        onNodeClick={onNodeClick}
      >
        <Background />
        <Controls />
        <MiniMap nodeStrokeWidth={3} nodeColor={miniMapNodeColor} pannable zoomable />
      </ReactFlow>

      <EventFlowNodeDrawer open={drawerOpen} onOpenChange={setDrawerOpen} selection={selection} />
    </div>
  );
};

export const EventFlowDiagram: React.FC<{ topology: EventListenerTopology | null }> = ({ topology }) => (
  <ReactFlowProvider>
    <div className="flex h-full w-full flex-1 flex-col">{topology && <Inner topology={topology} />}</div>
  </ReactFlowProvider>
);
