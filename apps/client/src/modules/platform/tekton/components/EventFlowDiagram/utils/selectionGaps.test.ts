import { describe, expect, test } from "vitest";
import { describeSelectionGaps } from "./selectionGaps";

describe("describeSelectionGaps", () => {
  test("no gaps produces no copy", () => {
    expect(describeSelectionGaps([])).toEqual([]);
  });

  test("a restricted Trigger watch is explained as a visibility problem, not a missing Trigger", () => {
    const [message] = describeSelectionGaps([{ kind: "triggersRestricted" }]);
    expect(message).toContain("not visible");
    expect(message).toContain("RBAC");
  });

  test("unsupported operators are listed and pluralised", () => {
    expect(describeSelectionGaps([{ kind: "unsupportedOperators", operators: ["Gt"] }])[0]).toContain("an operator");
    const many = describeSelectionGaps([{ kind: "unsupportedOperators", operators: ["Gt", "Lt"] }])[0];
    expect(many).toContain("operators");
    expect(many).toContain("Gt, Lt");
  });

  test("namespaces are listed, and the Tekton wildcard reads as all namespaces", () => {
    expect(describeSelectionGaps([{ kind: "otherNamespaces", namespaces: ["a", "b"] }])[0]).toContain("a, b");
    expect(describeSelectionGaps([{ kind: "otherNamespaces", namespaces: ["*"] }])[0]).toContain("all namespaces");
  });

  test("every gap produces exactly one message, in order", () => {
    expect(
      describeSelectionGaps([{ kind: "triggersRestricted" }, { kind: "otherNamespaces", namespaces: ["a"] }])
    ).toHaveLength(2);
  });
});
