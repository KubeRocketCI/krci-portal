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
import { Switch } from "@/core/components/ui/switch";
import { cn } from "@/core/utils/classname";
import type { NetGateway, NetHTTPRoute, NetIngress, NetworkingData } from "../types";
import type { ExposureMetrics } from "../live/useExposureMetrics";
import { NET_NODE_KIND, LEGEND, HEALTH_DOT, HEALTH_CSS_VAR, type Health } from "./constants";
import { InternetNode, GatewayNode, RouteNode, IngressNode, BackendNode, PodNode } from "./components/nodes";
import {
  useTopologyGraphData,
  type GatewayNodeData,
  type RouteNodeData,
  type IngressNodeData,
  type EdgeMeta,
} from "./useTopologyGraphData";
import { getLayoutedElements } from "./layoutUtils";

/**
 * Map edge health to a CSS color string.
 * Uses the same CSS variables as the MiniMap node coloring.
 */
const EDGE_COLOR = (health: Health): string => {
  switch (health) {
    case "red":
      return "var(--destructive)";
    case "amber":
      return "var(--color-amber-500)";
    case "green":
      return "var(--color-green-500)";
    default:
      return "var(--muted-foreground)";
  }
};

export type TopologySelection = NetGateway | NetHTTPRoute | NetIngress | null;

const nodeTypes = {
  [NET_NODE_KIND.INTERNET]: InternetNode,
  [NET_NODE_KIND.GATEWAY]: GatewayNode,
  [NET_NODE_KIND.ROUTE]: RouteNode,
  [NET_NODE_KIND.INGRESS]: IngressNode,
  [NET_NODE_KIND.BACKEND]: BackendNode,
  [NET_NODE_KIND.POD]: PodNode,
};

const readCssVar = (name: string): string => {
  if (typeof window === "undefined") return "#9ca3af";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#9ca3af";
};

const miniMapNodeColor = (node: Node): string => {
  const health = (node.data as { health?: Health } | undefined)?.health ?? "neutral";
  return readCssVar(HEALTH_CSS_VAR[health]);
};

const nodeToSelection = (node: Node): TopologySelection => {
  if (node.type === NET_NODE_KIND.GATEWAY) return (node.data as GatewayNodeData).gateway;
  if (node.type === NET_NODE_KIND.ROUTE) return (node.data as RouteNodeData).route;
  if (node.type === NET_NODE_KIND.INGRESS) return (node.data as IngressNodeData).ingress;
  return null;
};

type InnerProps = {
  data: NetworkingData;
  onSelect: (s: TopologySelection) => void;
  appName?: string;
  initialShowPods?: boolean;
  metrics?: ExposureMetrics;
};

const Inner: React.FC<InnerProps> = ({ data, onSelect, appName, initialShowPods = false, metrics }) => {
  const [direction, setDirection] = React.useState<"LR" | "TB">("LR");
  const [showMetrics, setShowMetrics] = React.useState(true);
  const [showPods, setShowPods] = React.useState(initialShowPods);
  const graphOpts = React.useMemo(() => ({ appName, showPods }), [appName, showPods]);
  const { nodes, edges, baseEdges } = useTopologyGraphData(data, direction, graphOpts, metrics);

  // Kiali-style: health-colored, animated edges with traffic-rate / success labels.
  const displayEdges = React.useMemo(
    () =>
      edges.map((e) => {
        const m = (e.data ?? {}) as Partial<EdgeMeta>;
        const health: Health = m.health ?? "neutral";
        const color = EDGE_COLOR(health);
        const isDegraded = health === "red";
        const parts: string[] = [];
        // FIX 1: only show "X%" label for genuine canary splits (showWeight=true).
        // Path-routing routes with one backend per rule have weight=100 but
        // showWeight=false, so they never render a misleading "100%" label.
        if (m.showWeight && m.weight !== undefined) parts.push(`${m.weight}%`);
        if (showMetrics) {
          if (m.rps !== undefined) parts.push(`${Math.round(m.rps * 10) / 10} rps`);
          // success encoded by health color; show text only when degraded
          if (m.success !== undefined && m.success < 100) parts.push(`${Math.floor(m.success)}%`);
        }
        return {
          ...e,
          animated: showMetrics && m.rps !== undefined && !isDegraded,
          label: parts.length ? parts.join(" · ") : undefined,
          labelStyle: { fontSize: 10 },
          style: { stroke: color, strokeWidth: 1.6, strokeDasharray: isDegraded ? "5 3" : undefined },
          markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color },
        };
      }),
    [edges, showMetrics]
  );

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(nodes);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(displayEdges);
  const { fitView, getNodes } = useReactFlow();
  const nodesInitialized = useNodesInitialized();
  const [layoutPhase, setLayoutPhase] = React.useState<"estimated" | "measured">("estimated");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const hasVisibleSizeRef = React.useRef(false);

  const onNodeClick = React.useCallback(
    (_: React.MouseEvent, node: Node) => {
      const sel = nodeToSelection(node);
      if (sel) onSelect(sel);
    },
    [onSelect]
  );

  React.useEffect(() => {
    setLayoutPhase("estimated");
    setFlowNodes(nodes);
  }, [nodes, setFlowNodes]);

  // Restyle edges (metrics toggle) without forcing a re-layout.
  React.useEffect(() => {
    setFlowEdges(displayEdges);
  }, [displayEdges, setFlowEdges]);

  React.useEffect(() => {
    if (!nodesInitialized || layoutPhase === "measured") return;
    const measured = getNodes();
    if (!measured.length || measured.some((n) => !n.measured?.width || !n.measured?.height)) return;
    const result = getLayoutedElements(measured, baseEdges, direction);
    setFlowNodes(result.nodes);
    setLayoutPhase("measured");
    const t = setTimeout(() => fitView({ padding: 0.15, maxZoom: 1.2, duration: 200 }), 50);
    return () => clearTimeout(t);
  }, [nodesInitialized, layoutPhase, getNodes, baseEdges, direction, setFlowNodes, fitView]);

  // Re-fit once the container first gets a real size. Inside the stage tab the
  // panel can mount at 0 height (or before layout settles); without this the
  // initial fitView runs against a tiny/zero viewport and the graph renders
  // cramped in a corner. Mirrors EventFlowDiagram.
  React.useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const ro = new ResizeObserver((entries) => {
      const e = entries[0];
      const ok = !!e && e.contentRect.width > 0 && e.contentRect.height > 0;
      if (ok && !hasVisibleSizeRef.current) {
        hasVisibleSizeRef.current = true;
        setTimeout(() => fitView({ padding: 0.15, maxZoom: 1.2, duration: 200 }), 60);
      } else if (!ok) {
        hasVisibleSizeRef.current = false;
      }
    });
    ro.observe(c);
    return () => ro.disconnect();
  }, [fitView]);

  const hasGatewayOrRoute = data.gateways.length > 0 || data.httpRoutes.length > 0;

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <Card className="absolute top-3 left-3 z-10">
        <CardContent className="flex flex-wrap gap-3 p-2.5 text-xs">
          {LEGEND.map(({ health, label }) => (
            <span key={health} className="text-muted-foreground inline-flex items-center gap-1.5">
              <span className={cn("inline-block size-2.5 rounded-full", HEALTH_DOT[health])} />
              {label}
            </span>
          ))}
          {metrics && !metrics.available && hasGatewayOrRoute && (
            <span className="text-muted-foreground/60 italic">live metrics unavailable</span>
          )}
        </CardContent>
      </Card>

      <Card className="absolute top-3 right-3 z-10">
        <CardContent className="flex flex-col gap-3 p-2.5">
          <div>
            <Label className="mb-1 block text-[11px]">Layout</Label>
            <ToggleButtonGroup
              aria-label="Graph layout direction"
              value={direction}
              exclusive
              onChange={(_, v) => v && setDirection(v as "LR" | "TB")}
              size="sm"
            >
              <ToggleButton value="LR">Horizontal</ToggleButton>
              <ToggleButton value="TB">Vertical</ToggleButton>
            </ToggleButtonGroup>
          </div>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="net-traffic" className="text-[11px]">
              Traffic metrics
            </Label>
            <Switch id="net-traffic" checked={showMetrics} onCheckedChange={setShowMetrics} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="net-pods" className="text-[11px]">
              Pods
            </Label>
            <Switch id="net-pods" checked={showPods} onCheckedChange={setShowPods} />
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
          markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
          style: { strokeWidth: 1.5 },
        }}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.2}
        maxZoom={2}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        proOptions={{ hideAttribution: true }}
        onNodeClick={onNodeClick}
      >
        <Background />
        <Controls showInteractive={false} />
        <MiniMap nodeStrokeWidth={3} nodeColor={miniMapNodeColor} pannable zoomable />
      </ReactFlow>
    </div>
  );
};

export const NetworkTopology: React.FC<{
  data: NetworkingData;
  onSelect: (s: TopologySelection) => void;
  /** When set, the graph is scoped to a single Application's exposure path. */
  appName?: string;
  /** Start with the Service → Pods lane expanded (default on for app-scope). */
  initialShowPods?: boolean;
  /** Live Prometheus exposure metrics — undefined when not yet available. */
  metrics?: ExposureMetrics;
}> = ({ data, onSelect, appName, initialShowPods, metrics }) => (
  <ReactFlowProvider>
    <Inner data={data} onSelect={onSelect} appName={appName} initialShowPods={initialShowPods} metrics={metrics} />
  </ReactFlowProvider>
);
