import { Edge, Node, Position } from "@xyflow/react";
import dagre from "dagre";
import { NODE_KIND, NodeKind } from "../constants";

interface NodeSize {
  width: number;
  height: number;
}

const DEFAULT_SIZE: NodeSize = { width: 220, height: 90 };

// Approximate rendered node sizes per kind. Dagre uses these to allocate
// inter-rank spacing; if they are smaller than the actual rendered width,
// adjacent columns overlap (notably TriggerTemplate ↔ Pipeline where the
// "creates: PipelineRun → ..." and "${tt.params...}" lines push the box
// well past 220px).
const NODE_SIZE_BY_KIND: Record<NodeKind, NodeSize> = {
  [NODE_KIND.GIT_SOURCE]: { width: 220, height: 72 },
  [NODE_KIND.EVENT_LISTENER]: { width: 360, height: 100 },
  [NODE_KIND.TRIGGER]: { width: 260, height: 80 },
  [NODE_KIND.INTERCEPTOR]: { width: 360, height: 130 },
  [NODE_KIND.TRIGGER_BINDING]: { width: 260, height: 80 },
  [NODE_KIND.TRIGGER_TEMPLATE]: { width: 360, height: 92 },
  [NODE_KIND.PIPELINE]: { width: 320, height: 110 },
};

const sizeOf = (node: Node): NodeSize => {
  // Once xyflow has measured the rendered DOM, prefer the actual size — that is
  // what makes handles line up exactly at the visible node edges so smoothstep
  // edges enter cleanly through the left/right handle instead of clipping the
  // box. Falls back to per-kind estimates on the first pass (before measure).
  const measuredW = node.measured?.width;
  const measuredH = node.measured?.height;
  if (measuredW && measuredH) return { width: measuredW, height: measuredH };

  const kind = node.type;
  if (!kind || !(kind in NODE_SIZE_BY_KIND)) return DEFAULT_SIZE;
  return NODE_SIZE_BY_KIND[kind as NodeKind];
};

export const getLayoutedElements = <T extends Node>(
  nodes: T[],
  edges: Edge[],
  direction: "TB" | "LR" = "LR"
): { nodes: T[]; edges: Edge[] } => {
  const isHorizontal = direction === "LR";
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 110, marginx: 30, marginy: 30 });

  const visibleEdges = edges.filter((e) => !e.hidden);
  nodes.forEach((node) => {
    const { width, height } = sizeOf(node);
    dagreGraph.setNode(node.id, { width, height });
  });
  visibleEdges.forEach((edge) => dagreGraph.setEdge(edge.source, edge.target));

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const pos = dagreGraph.node(node.id);
    const { width, height } = sizeOf(node);
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: { x: pos.x - width / 2, y: pos.y - height / 2 },
      draggable: false,
    };
  });

  return { nodes: layoutedNodes, edges: visibleEdges };
};
