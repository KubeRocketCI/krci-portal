import { describe, expect, test } from "vitest";
import { eventListenerSchema } from "@my-project/shared";
import { matchFunctions, EVENT_LISTENER_LIST_FILTER_NAMES } from "./constants";

const searchMatch = matchFunctions[EVENT_LISTENER_LIST_FILTER_NAMES.SEARCH]!;
const namespaceMatch = matchFunctions[EVENT_LISTENER_LIST_FILTER_NAMES.NAMESPACES]!;

const make = (name: string, namespace = "ns") =>
  eventListenerSchema.parse({
    apiVersion: "triggers.tekton.dev/v1beta1",
    kind: "EventListener",
    metadata: { name, namespace, uid: `u-${name}`, creationTimestamp: "2025-01-01T00:00:00Z", labels: {} },
    spec: { triggers: [] },
  });

describe("matchFunctions.search", () => {
  test("empty search passes everything", () => {
    expect(searchMatch(make("github-build"), "")).toBe(true);
  });
  test("name substring match is case-insensitive", () => {
    expect(searchMatch(make("Github-Build"), "github")).toBe(true);
  });
  test("non-matching name is filtered out", () => {
    expect(searchMatch(make("github-build"), "gitlab")).toBe(false);
  });
});

describe("matchFunctions.namespaces", () => {
  test("empty selection passes everything", () => {
    expect(namespaceMatch(make("x", "ns1"), [])).toBe(true);
  });
  test("matching namespace is kept", () => {
    expect(namespaceMatch(make("x", "ns1"), ["ns1"])).toBe(true);
  });
  test("non-matching namespace is dropped", () => {
    expect(namespaceMatch(make("x", "ns1"), ["ns2"])).toBe(false);
  });
});
