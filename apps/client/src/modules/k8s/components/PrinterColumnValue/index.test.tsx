import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PrinterColumnValue } from "./index";

const item = {
  metadata: { name: "pr-1", creationTimestamp: "2026-05-15T10:00:00Z" },
  spec: { replicas: 3, paused: false },
  status: { phase: "Running", number: 42.7 },
};

describe("PrinterColumnValue", () => {
  it("renders string values", () => {
    render(<PrinterColumnValue item={item as never} jsonPath=".status.phase" type="string" />);
    expect(screen.getByText("Running")).toBeInTheDocument();
  });

  it("renders integer values", () => {
    render(<PrinterColumnValue item={item as never} jsonPath=".spec.replicas" type="integer" />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders number values", () => {
    render(<PrinterColumnValue item={item as never} jsonPath=".status.number" type="number" />);
    expect(screen.getByText("42.7")).toBeInTheDocument();
  });

  it("renders boolean false as False", () => {
    render(<PrinterColumnValue item={item as never} jsonPath=".spec.paused" type="boolean" />);
    expect(screen.getByText("False")).toBeInTheDocument();
  });

  it("renders boolean true as True", () => {
    const trueItem = { ...item, spec: { ...item.spec, paused: true } };
    render(<PrinterColumnValue item={trueItem as never} jsonPath=".spec.paused" type="boolean" />);
    expect(screen.getByText("True")).toBeInTheDocument();
  });

  it("renders string 'true' as True (case-insensitive)", () => {
    const strItem = { ...item, spec: { ...item.spec, paused: "true" } };
    render(<PrinterColumnValue item={strItem as never} jsonPath=".spec.paused" type="boolean" />);
    expect(screen.getByText("True")).toBeInTheDocument();
  });

  it("renders string 'TRUE' as True (case-insensitive)", () => {
    const strItem = { ...item, spec: { ...item.spec, paused: "TRUE" } };
    render(<PrinterColumnValue item={strItem as never} jsonPath=".spec.paused" type="boolean" />);
    expect(screen.getByText("True")).toBeInTheDocument();
  });

  it("renders string 'false' as False (not True — string 'false' is JS-truthy)", () => {
    const strItem = { ...item, spec: { ...item.spec, paused: "false" } };
    render(<PrinterColumnValue item={strItem as never} jsonPath=".spec.paused" type="boolean" />);
    expect(screen.getByText("False")).toBeInTheDocument();
  });

  it("renders string 'False' as False (case-insensitive)", () => {
    const strItem = { ...item, spec: { ...item.spec, paused: "False" } };
    render(<PrinterColumnValue item={strItem as never} jsonPath=".spec.paused" type="boolean" />);
    expect(screen.getByText("False")).toBeInTheDocument();
  });

  it("renders em-dash for a non-boolean string value in a boolean column ('yes')", () => {
    const strItem = { ...item, spec: { ...item.spec, paused: "yes" } };
    render(<PrinterColumnValue item={strItem as never} jsonPath=".spec.paused" type="boolean" />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("returns null for creationTimestamp jsonPath (defense-in-depth)", () => {
    const { container } = render(
      <PrinterColumnValue item={item as never} jsonPath=".metadata.creationTimestamp" type="date" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("returns em-dash on missing JSONPath segments", () => {
    render(<PrinterColumnValue item={item as never} jsonPath=".missing.field" type="string" />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("returns em-dash for filter-expression JSONPath (unsupported)", () => {
    render(
      <PrinterColumnValue
        item={item as never}
        jsonPath={'.status.conditions[?(@.type=="Ready")].status'}
        type="string"
      />
    );
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders the value when label-selector bracket syntax targets a present label", () => {
    const itemWithLabels = {
      ...item,
      metadata: { ...item.metadata, labels: { app: "demo" } },
    };
    render(<PrinterColumnValue item={itemWithLabels as never} jsonPath=".metadata.labels['app']" type="string" />);
    expect(screen.getByText("demo")).toBeInTheDocument();
  });

  it("returns em-dash when label-selector bracket key is absent on the item", () => {
    render(<PrinterColumnValue item={item as never} jsonPath=".metadata.labels['missing']" type="string" />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders a relative-time string for type=date with a valid ISO timestamp", () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const itemWithDate = { ...item, status: { ...item.status, ts: oneHourAgo } };
    render(<PrinterColumnValue item={itemWithDate as never} jsonPath=".status.ts" type="date" />);
    // formatRelativeTime produces variants like "1h ago", "60m ago", etc. — match loosely.
    expect(screen.getByText(/ago|now|just/i)).toBeInTheDocument();
  });

  it("renders formatRelativeTime's hyphen fallback for type=date with a non-parseable timestamp", () => {
    // formatRelativeTime returns "-" (not the em-dash "—") for invalid inputs and never throws,
    // so the component's catch branch is unreachable; the rendered text is the bare hyphen.
    const itemWithBadDate = { ...item, status: { ...item.status, ts: "not-a-date" } };
    render(<PrinterColumnValue item={itemWithBadDate as never} jsonPath=".status.ts" type="date" />);
    expect(screen.getByText("-")).toBeInTheDocument();
  });
});
