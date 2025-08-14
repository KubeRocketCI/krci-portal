import { Node, Edge, Position } from "@xyflow/react";
import dagre from "dagre";

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 180;
const nodeHeight = 60;

export const getLayoutedElements = (nodes: Node[], edges: Edge[], direction: "TB" | "LR" = "TB") => {
  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 30, // Reduced from 50 - horizontal spacing between nodes
    ranksep: 60, // Reduced from 100 - vertical spacing between ranks
    marginx: 30, // Reduced from 50 - left/right margin
    marginy: 30, // Reduced from 50 - top/bottom margin
  });

  // Clear the graph
  dagreGraph.nodes().forEach((nodeId) => dagreGraph.removeNode(nodeId));

  // Add nodes to the graph
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  // Add edges to the graph (include constraint edges for layout)
  edges.forEach((edge) => {
    // Include all edges including constraint edges for proper positioning
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(dagreGraph);

  // Apply layout positions to nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
      draggable: false, // Disable node dragging
    };

    return newNode;
  });

  // Filter out constraint edges from final rendering
  const visibleEdges = edges.filter((edge) => !edge.hidden);

  return { nodes: layoutedNodes, edges: visibleEdges };
};
