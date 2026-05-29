import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CROverviewTab } from "./CROverviewTab";

const crd = {
  spec: {
    group: "tekton.dev",
    scope: "Namespaced",
    names: { kind: "PipelineRun", plural: "pipelineruns" },
    versions: [
      {
        name: "v1",
        served: true,
        storage: true,
        additionalPrinterColumns: [
          { name: "Status", type: "string", jsonPath: ".status.phase", description: "Current phase" },
        ],
      },
    ],
  },
} as never;

const item = {
  metadata: { name: "pr-1", namespace: "dev" },
  status: { phase: "Running", conditions: [{ type: "Succeeded", status: "Unknown" }] },
} as never;

describe("CROverviewTab", () => {
  it("renders a row per printer column with the value extracted by JSONPath", () => {
    render(<CROverviewTab crd={crd} item={item} version="v1" />);
    expect(screen.getAllByText("Status").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Running")).toBeInTheDocument();
  });

  it("renders ConditionsTable when conditions are present", () => {
    render(<CROverviewTab crd={crd} item={item} version="v1" />);
    expect(screen.getByText("Succeeded")).toBeInTheDocument();
  });

  it("hides ConditionsTable when no conditions are present", () => {
    const noCond = { ...(item as object), status: { phase: "Running" } } as never;
    render(<CROverviewTab crd={crd} item={noCond} version="v1" />);
    expect(screen.queryByRole("columnheader", { name: "Type" })).not.toBeInTheDocument();
  });
});
