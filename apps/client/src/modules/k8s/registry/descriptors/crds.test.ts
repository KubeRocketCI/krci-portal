import { describe, expect, it } from "vitest";
import { crdsDescriptor } from "./crds";

const crd = (conditions?: Array<{ type: string; status: string }>) =>
  ({
    metadata: { name: "x.example.com" },
    status: { conditions },
  }) as never;

describe("crdsDescriptor.status", () => {
  it("derives Established when condition is True", () => {
    expect(crdsDescriptor.status!(crd([{ type: "Established", status: "True" }]))).toMatchObject({
      phase: "Established",
      severity: "success",
    });
  });
  it("derives NotEstablished when condition is False", () => {
    expect(crdsDescriptor.status!(crd([{ type: "Established", status: "False" }]))).toMatchObject({
      phase: "NotEstablished",
      severity: "destructive",
    });
  });
  it("derives Unknown when condition is missing or Unknown", () => {
    expect(crdsDescriptor.status!(crd())).toMatchObject({ phase: "Unknown", severity: "secondary" });
    expect(crdsDescriptor.status!(crd([{ type: "Established", status: "Unknown" }]))).toMatchObject({
      phase: "Unknown",
      severity: "secondary",
    });
  });
  it("derives NamesConflict (destructive) when NamesAccepted is False, even if Established is True", () => {
    expect(
      crdsDescriptor.status!(
        crd([
          { type: "Established", status: "True" },
          { type: "NamesAccepted", status: "False" },
        ])
      )
    ).toMatchObject({ phase: "NamesConflict", severity: "destructive" });
  });
});

describe("crdsDescriptor.config", () => {
  it("is cluster-scoped apiextensions.k8s.io/v1 customresourcedefinitions", () => {
    expect(crdsDescriptor.config).toMatchObject({
      apiVersion: "apiextensions.k8s.io/v1",
      kind: "CustomResourceDefinition",
      group: "apiextensions.k8s.io",
      version: "v1",
      pluralName: "customresourcedefinitions",
      clusterScoped: true,
    });
  });
});
