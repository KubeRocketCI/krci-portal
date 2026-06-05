import { describe, expect, it } from "vitest";
import { involvedObjectFieldSelector } from "./index";

describe("involvedObjectFieldSelector", () => {
  it("prefers uid when present", () => {
    expect(involvedObjectFieldSelector({ kind: "Pod", metadata: { uid: "u-1", name: "p", namespace: "ns" } })).toBe(
      "involvedObject.uid=u-1"
    );
  });

  it("falls back to kind+name+namespace when uid is missing", () => {
    expect(involvedObjectFieldSelector({ kind: "Pod", metadata: { name: "p", namespace: "ns" } })).toBe(
      "involvedObject.kind=Pod,involvedObject.name=p,involvedObject.namespace=ns"
    );
  });

  it("omits kind and namespace when only a name is known", () => {
    expect(involvedObjectFieldSelector({ metadata: { name: "p" } })).toBe("involvedObject.name=p");
  });

  it("returns undefined when nothing identifying is present", () => {
    expect(involvedObjectFieldSelector({ metadata: {} })).toBeUndefined();
    expect(involvedObjectFieldSelector({})).toBeUndefined();
  });
});
