import { describe, expect, it } from "vitest";
import { k8sEventConfig } from "./constants.js";

describe("k8sEventConfig", () => {
  it("has the correct K8sResourceConfig shape", () => {
    expect(k8sEventConfig).toMatchObject({
      group: "",
      version: "v1",
      apiVersion: "v1",
      kind: "Event",
      singularName: "event",
      pluralName: "events",
    });
  });

  it("does not have clusterScoped set", () => {
    expect(k8sEventConfig).not.toHaveProperty("clusterScoped");
  });
});
