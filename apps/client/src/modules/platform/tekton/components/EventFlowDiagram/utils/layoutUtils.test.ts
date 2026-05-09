import { describe, expect, test } from "vitest";
import { Edge, Node, Position } from "@xyflow/react";
import { getLayoutedElements } from "./layoutUtils";

describe("getLayoutedElements", () => {
  test("LR layout assigns Left/Right handles", () => {
    const nodes: Node[] = [
      { id: "a", data: {}, position: { x: 0, y: 0 } },
      { id: "b", data: {}, position: { x: 0, y: 0 } },
    ];
    const edges: Edge[] = [{ id: "ab", source: "a", target: "b" }];
    const result = getLayoutedElements(nodes, edges, "LR");
    result.nodes.forEach((n) => {
      expect(n.targetPosition).toBe(Position.Left);
      expect(n.sourcePosition).toBe(Position.Right);
      expect(n.draggable).toBe(false);
    });
  });

  test("TB layout assigns Top/Bottom handles", () => {
    const nodes: Node[] = [{ id: "a", data: {}, position: { x: 0, y: 0 } }];
    const result = getLayoutedElements(nodes, [], "TB");
    expect(result.nodes[0].targetPosition).toBe(Position.Top);
    expect(result.nodes[0].sourcePosition).toBe(Position.Bottom);
  });

  test("assigns non-zero positions to multi-node graph", () => {
    const nodes: Node[] = [
      { id: "a", data: {}, position: { x: 0, y: 0 } },
      { id: "b", data: {}, position: { x: 0, y: 0 } },
      { id: "c", data: {}, position: { x: 0, y: 0 } },
    ];
    const edges: Edge[] = [
      { id: "ab", source: "a", target: "b" },
      { id: "bc", source: "b", target: "c" },
    ];
    const result = getLayoutedElements(nodes, edges, "LR");
    const allZero = result.nodes.every((n) => n.position.x === 0 && n.position.y === 0);
    expect(allZero).toBe(false);
  });

  test("preserves node data and ids", () => {
    const nodes: Node[] = [{ id: "x", data: { label: "X", custom: 1 }, position: { x: 0, y: 0 }, type: "custom" }];
    const result = getLayoutedElements(nodes, [], "LR");
    expect(result.nodes[0].id).toBe("x");
    expect(result.nodes[0].data.label).toBe("X");
    expect(result.nodes[0].type).toBe("custom");
  });

  test("filters out hidden edges", () => {
    const nodes: Node[] = [
      { id: "a", data: {}, position: { x: 0, y: 0 } },
      { id: "b", data: {}, position: { x: 0, y: 0 } },
    ];
    const edges: Edge[] = [
      { id: "ab", source: "a", target: "b" },
      { id: "hidden", source: "a", target: "b", hidden: true },
    ];
    const result = getLayoutedElements(nodes, edges, "LR");
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0].id).toBe("ab");
  });

  test("handles empty input", () => {
    const result = getLayoutedElements([], [], "LR");
    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
  });
});
