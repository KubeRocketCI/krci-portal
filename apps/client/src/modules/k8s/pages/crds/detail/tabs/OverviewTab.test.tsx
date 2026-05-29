import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CRDObject } from "@my-project/shared";
import { CRDOverviewTab } from "./OverviewTab";

const crd = {
  apiVersion: "apiextensions.k8s.io/v1",
  kind: "CustomResourceDefinition",
  metadata: { name: "x.example.com", uid: "u", creationTimestamp: "" },
  spec: {
    group: "example.com",
    scope: "Namespaced",
    names: { kind: "X", plural: "xs", singular: "x", listKind: "XList" },
    versions: [
      { name: "v1", served: true, storage: true },
      { name: "v1beta1", served: true, storage: false },
    ],
  },
  status: { conditions: [{ type: "Established", status: "True", lastTransitionTime: "2026-05-15T10:00:00Z" }] },
} as unknown as CRDObject;

describe("CRDOverviewTab", () => {
  it("renders Names, Versions, Scope row, and Conditions", () => {
    render(<CRDOverviewTab item={crd} />);
    expect(screen.getByText("Names")).toBeInTheDocument();
    expect(screen.getByText("Versions")).toBeInTheDocument();
    expect(screen.getByText("v1")).toBeInTheDocument();
    expect(screen.getByText("example.com")).toBeInTheDocument(); // Group field
    expect(screen.getByText("Established")).toBeInTheDocument(); // Conditions table row
  });

  it("renders an empty-state row when there are no versions defined", () => {
    const empty = {
      ...crd,
      spec: { ...crd.spec, versions: [] },
    } as unknown as CRDObject;
    render(<CRDOverviewTab item={empty} />);
    expect(screen.getByText(/No versions defined/i)).toBeInTheDocument();
  });
});
