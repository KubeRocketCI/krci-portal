// dagre auto-layout for the exposure topology — adapted from the repo's
// EventFlowDiagram/utils/layoutUtils.ts (same two-phase estimated→measured flow).
import { Edge, Node, Position } from "@xyflow/react";
import dagre from "dagre";
import { NET_NODE_KIND, NetNodeKind } from "./constants";

interface NodeSize {
  width: number;
  height: number;
}

const DEFAULT_SIZE: NodeSize = { width: 220, height: 84 };

const NODE_SIZE_BY_KIND: Record<NetNodeKind, NodeSize> = {
  [NET_NODE_KIND.INTERNET]: { width: 150, height: 60 },
  [NET_NODE_KIND.GATEWAY]: { width: 250, height: 104 },
  [NET_NODE_KIND.ROUTE]: { width: 250, height: 104 },
  [NET_NODE_KIND.INGRESS]: { width: 240, height: 88 },
  [NET_NODE_KIND.BACKEND]: { width: 200, height: 72 },
  [NET_NODE_KIND.POD]: { width: 190, height: 56 },
};

const sizeOf = (node: Node): NodeSize => {
  const measuredW = node.measured?.width;
  const measuredH = node.measured?.height;
  if (measuredW && measuredH) return { width: measuredW, height: measuredH };
  const kind = node.type;
  if (!kind || !(kind in NODE_SIZE_BY_KIND)) return DEFAULT_SIZE;
  return NODE_SIZE_BY_KIND[kind as NetNodeKind];
};

export const getLayoutedElements = <T extends Node>(
  nodes: T[],
  edges: Edge[],
  direction: "TB" | "LR" = "LR"
): { nodes: T[]; edges: Edge[] } => {
  const isHorizontal = direction === "LR";
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 40, ranksep: 90, marginx: 24, marginy: 24 });

  const visibleEdges = edges.filter((e) => !e.hidden);
  nodes.forEach((node) => {
    const { width, height } = sizeOf(node);
    g.setNode(node.id, { width, height });
  });
  visibleEdges.forEach((edge) => g.setEdge(edge.source, edge.target));

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id);
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
