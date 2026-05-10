import { describe, expect, it } from "vitest";
import { k8sJobConfig } from "./constants.js";

describe("k8sJobConfig", () => {
  it("has the correct K8sResourceConfig shape", () => {
    expect(k8sJobConfig).toMatchObject({
      group: "batch",
      version: "v1",
      apiVersion: "batch/v1",
      kind: "Job",
      singularName: "job",
      pluralName: "jobs",
    });
  });
});
