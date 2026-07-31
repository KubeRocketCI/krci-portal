import { describe, expect, test } from "vitest";
import { eventListenerSchema, triggerSchema } from "@my-project/shared";
import {
  labelSelectorTerms,
  otherSelectedNamespaces,
  parseLabelSelector,
  triggerMatchesSelector,
} from "./labelSelector";

const ns = "edp-delivery";

const el = (spec: object | undefined) =>
  eventListenerSchema.parse({
    apiVersion: "triggers.tekton.dev/v1beta1",
    kind: "EventListener",
    metadata: { name: "el", namespace: ns, uid: "u-el", creationTimestamp: "2025-01-01T00:00:00Z" },
    ...(spec ? { spec } : {}),
  });

const trigger = (labels: Record<string, string>) =>
  triggerSchema.parse({
    apiVersion: "triggers.tekton.dev/v1beta1",
    kind: "Trigger",
    metadata: { name: "t", namespace: ns, uid: "u-t", creationTimestamp: "2025-01-01T00:00:00Z", labels },
    spec: {},
  });

describe("parseLabelSelector", () => {
  test("an EventListener with no spec yields an inactive selector", () => {
    expect(parseLabelSelector(el(undefined))).toEqual({
      matchLabels: {},
      matchExpressions: [],
      active: false,
      unsupportedOperators: [],
    });
  });

  test("an empty selector object is inactive — it selects nothing rather than everything", () => {
    expect(parseLabelSelector(el({ labelSelector: { matchLabels: {}, matchExpressions: [] } })).active).toBe(false);
  });

  test("matchLabels or matchExpressions alone activates the selector", () => {
    expect(parseLabelSelector(el({ labelSelector: { matchLabels: { a: "b" } } })).active).toBe(true);
    expect(
      parseLabelSelector(el({ labelSelector: { matchExpressions: [{ key: "a", operator: "Exists" }] } })).active
    ).toBe(true);
  });

  test("entries missing key or operator are dropped instead of throwing", () => {
    const parsed = parseLabelSelector(
      el({ labelSelector: { matchExpressions: [{ key: "a", operator: "Exists" }, { key: "b" }, null, 7] } })
    );
    expect(parsed.matchExpressions).toEqual([{ key: "a", operator: "Exists" }]);
  });

  test("unknown operators are collected once each", () => {
    const parsed = parseLabelSelector(
      el({
        labelSelector: {
          matchExpressions: [
            { key: "a", operator: "Gt" },
            { key: "b", operator: "Gt" },
            { key: "c", operator: "In", values: ["x"] },
          ],
        },
      })
    );
    expect(parsed.unsupportedOperators).toEqual(["Gt"]);
  });
});

describe("labelSelectorTerms", () => {
  test("renders matchLabels pairs then matchExpressions in kubectl syntax", () => {
    const parsed = parseLabelSelector(
      el({
        labelSelector: {
          matchLabels: { app: "el" },
          matchExpressions: [
            { key: "type", operator: "In", values: ["build", "review"] },
            { key: "type", operator: "NotIn", values: ["deploy"] },
            { key: "managed", operator: "Exists" },
            { key: "legacy", operator: "DoesNotExist" },
          ],
        },
      })
    );
    expect(labelSelectorTerms(parsed)).toEqual([
      "app=el",
      "type in (build, review)",
      "type notin (deploy)",
      "managed",
      "!legacy",
    ]);
  });

  test("an unknown operator still renders readably instead of being dropped from the summary", () => {
    const parsed = parseLabelSelector(
      el({ labelSelector: { matchExpressions: [{ key: "n", operator: "Gt", values: ["3"] }] } })
    );
    expect(labelSelectorTerms(parsed)).toEqual(["n Gt (3)"]);
  });
});

describe("triggerMatchesSelector", () => {
  const matches = (labels: Record<string, string>, labelSelector: object) =>
    triggerMatchesSelector(trigger(labels), parseLabelSelector(el({ labelSelector })));

  test("every matchLabels pair must be present with the same value", () => {
    expect(matches({ a: "1", b: "2" }, { matchLabels: { a: "1" } })).toBe(true);
    expect(matches({ a: "1" }, { matchLabels: { a: "1", b: "2" } })).toBe(false);
    expect(matches({ a: "2" }, { matchLabels: { a: "1" } })).toBe(false);
  });

  test("NotIn and DoesNotExist hold for an absent key", () => {
    expect(matches({}, { matchExpressions: [{ key: "a", operator: "NotIn", values: ["1"] }] })).toBe(true);
    expect(matches({}, { matchExpressions: [{ key: "a", operator: "DoesNotExist" }] })).toBe(true);
  });

  test("an In requirement with no values matches nothing", () => {
    expect(matches({ a: "1" }, { matchExpressions: [{ key: "a", operator: "In" }] })).toBe(false);
  });

  test("an unevaluable operator never matches, so the UI cannot claim a Trigger fires", () => {
    expect(matches({ a: "1" }, { matchExpressions: [{ key: "a", operator: "Gt", values: ["0"] }] })).toBe(false);
  });
});

describe("otherSelectedNamespaces", () => {
  test("returns nothing when namespaceSelector is absent or names only the own namespace", () => {
    expect(otherSelectedNamespaces(el({}))).toEqual([]);
    expect(otherSelectedNamespaces(el({ namespaceSelector: { matchNames: [ns] } }))).toEqual([]);
  });

  test("deduplicates and excludes the EventListener's own namespace", () => {
    expect(otherSelectedNamespaces(el({ namespaceSelector: { matchNames: [ns, "a", "b", "a"] } }))).toEqual(["a", "b"]);
  });

  test("the wildcard is preserved for the caller to render", () => {
    expect(otherSelectedNamespaces(el({ namespaceSelector: { matchNames: ["*"] } }))).toEqual(["*"]);
  });

  test("non-string entries are ignored rather than throwing", () => {
    expect(otherSelectedNamespaces(el({ namespaceSelector: { matchNames: ["a", null, 3] } }))).toEqual(["a"]);
  });
});
