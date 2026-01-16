import { describe, expect, test } from "vitest";
import { getLayoutedElements } from "./layoutUtils";
import { Node, Edge, Position } from "@xyflow/react";

describe("getLayoutedElements", () => {
  test("layouts nodes in top-to-bottom direction by default", () => {
    const nodes: Node[] = [
      { id: "1", data: { label: "Node 1" }, position: { x: 0, y: 0 } },
      { id: "2", data: { label: "Node 2" }, position: { x: 0, y: 0 } },
    ];

    const edges: Edge[] = [{ id: "e1-2", source: "1", target: "2" }];

    const result = getLayoutedElements(nodes, edges);

    // Verify nodes are returned
    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);

    // Check positions are assigned (not all zero)
    const positions = result.nodes.map((n) => ({ x: n.position.x, y: n.position.y }));
    const allZero = positions.every((p) => p.x === 0 && p.y === 0);
    expect(allZero).toBe(false);

    // Check target and source positions for TB layout
    result.nodes.forEach((node) => {
      expect(node.targetPosition).toBe(Position.Top);
      expect(node.sourcePosition).toBe(Position.Bottom);
      expect(node.draggable).toBe(false);
    });
  });

  test("layouts nodes in left-to-right direction", () => {
    const nodes: Node[] = [
      { id: "1", data: { label: "Node 1" }, position: { x: 0, y: 0 } },
      { id: "2", data: { label: "Node 2" }, position: { x: 0, y: 0 } },
    ];

    const edges: Edge[] = [{ id: "e1-2", source: "1", target: "2" }];

    const result = getLayoutedElements(nodes, edges, "LR");

    // Check target and source positions for LR layout
    result.nodes.forEach((node) => {
      expect(node.targetPosition).toBe(Position.Left);
      expect(node.sourcePosition).toBe(Position.Right);
    });
  });

  test("handles empty nodes and edges", () => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const result = getLayoutedElements(nodes, edges);

    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
  });

  test("handles single node without edges", () => {
    const nodes: Node[] = [{ id: "1", data: { label: "Node 1" }, position: { x: 0, y: 0 } }];

    const edges: Edge[] = [];

    const result = getLayoutedElements(nodes, edges);

    expect(result.nodes).toHaveLength(1);
    expect(result.edges).toHaveLength(0);

    const node = result.nodes[0];
    expect(node.id).toBe("1");
    expect(node.draggable).toBe(false);
  });

  test("filters out hidden edges", () => {
    const nodes: Node[] = [
      { id: "1", data: { label: "Node 1" }, position: { x: 0, y: 0 } },
      { id: "2", data: { label: "Node 2" }, position: { x: 0, y: 0 } },
      { id: "3", data: { label: "Node 3" }, position: { x: 0, y: 0 } },
    ];

    const edges: Edge[] = [
      { id: "e1-2", source: "1", target: "2" },
      { id: "e2-3", source: "2", target: "3", hidden: true },
    ];

    const result = getLayoutedElements(nodes, edges);

    // Only visible edges should be in the result
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0].id).toBe("e1-2");
    expect(result.edges.find((e) => e.id === "e2-3")).toBeUndefined();
  });

  test("preserves node data", () => {
    const nodes: Node[] = [
      {
        id: "1",
        data: { label: "Node 1", custom: "value" },
        position: { x: 0, y: 0 },
        type: "custom",
      },
    ];

    const edges: Edge[] = [];

    const result = getLayoutedElements(nodes, edges);

    const node = result.nodes[0];
    expect(node.data.label).toBe("Node 1");
    expect(node.data.custom).toBe("value");
    expect(node.type).toBe("custom");
  });

  test("handles complex graph with multiple edges", () => {
    const nodes: Node[] = [
      { id: "1", data: { label: "Node 1" }, position: { x: 0, y: 0 } },
      { id: "2", data: { label: "Node 2" }, position: { x: 0, y: 0 } },
      { id: "3", data: { label: "Node 3" }, position: { x: 0, y: 0 } },
      { id: "4", data: { label: "Node 4" }, position: { x: 0, y: 0 } },
    ];

    const edges: Edge[] = [
      { id: "e1-2", source: "1", target: "2" },
      { id: "e1-3", source: "1", target: "3" },
      { id: "e2-4", source: "2", target: "4" },
      { id: "e3-4", source: "3", target: "4" },
    ];

    const result = getLayoutedElements(nodes, edges);

    expect(result.nodes).toHaveLength(4);
    expect(result.edges).toHaveLength(4);

    // All nodes should have positions assigned
    result.nodes.forEach((node) => {
      expect(typeof node.position.x).toBe("number");
      expect(typeof node.position.y).toBe("number");
    });
  });

  test("sets all nodes as non-draggable", () => {
    const nodes: Node[] = [
      { id: "1", data: { label: "Node 1" }, position: { x: 0, y: 0 }, draggable: true },
      { id: "2", data: { label: "Node 2" }, position: { x: 0, y: 0 } },
    ];

    const edges: Edge[] = [{ id: "e1-2", source: "1", target: "2" }];

    const result = getLayoutedElements(nodes, edges);

    result.nodes.forEach((node) => {
      expect(node.draggable).toBe(false);
    });
  });

  test("preserves node IDs", () => {
    const nodes: Node[] = [
      { id: "custom-id-1", data: { label: "Node 1" }, position: { x: 0, y: 0 } },
      { id: "custom-id-2", data: { label: "Node 2" }, position: { x: 0, y: 0 } },
    ];

    const edges: Edge[] = [{ id: "e1-2", source: "custom-id-1", target: "custom-id-2" }];

    const result = getLayoutedElements(nodes, edges);

    expect(result.nodes[0].id).toBe("custom-id-1");
    expect(result.nodes[1].id).toBe("custom-id-2");
  });

  test("handles nodes with no connections", () => {
    const nodes: Node[] = [
      { id: "1", data: { label: "Node 1" }, position: { x: 0, y: 0 } },
      { id: "2", data: { label: "Node 2" }, position: { x: 0, y: 0 } },
      { id: "3", data: { label: "Node 3" }, position: { x: 0, y: 0 } },
    ];

    const edges: Edge[] = [{ id: "e1-2", source: "1", target: "2" }];

    const result = getLayoutedElements(nodes, edges);

    // All 3 nodes should be present even though node 3 has no edges
    expect(result.nodes).toHaveLength(3);
    expect(result.edges).toHaveLength(1);
  });
});
