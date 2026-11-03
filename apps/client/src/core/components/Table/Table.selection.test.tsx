import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTable } from "./index";
import { DataTableClientProps, TableColumn } from "./types";
import { stubResizeObserver } from "@/test/utils/resize-observer";

/**
 * Row selection through the real shell and body: the disabled checkbox of an unselectable row
 * carries the `getRowUnselectableReason` text as its accessible name and tooltip.
 */

// Reads router state, which this test does not stand up.
vi.mock("@/core/hooks/usePagination", () => ({
  usePagination: vi.fn(() => ({
    page: 0,
    rowsPerPage: 25,
    handleChangePage: vi.fn(),
    handleChangeRowsPerPage: vi.fn(),
  })),
}));

const TABLE_ID = "selectionTest";
const REASON = "Row is archived";

interface Run {
  name: string;
  archived: boolean;
}

const columns: TableColumn<Run>[] = [
  {
    id: "name",
    label: "Name",
    data: { render: ({ data }) => data.name },
    cell: { baseWidth: 100 },
  },
];

const data: Run[] = [
  { name: "live", archived: false },
  { name: "archived", archived: true },
];

const renderTable = (selection: Partial<NonNullable<DataTableClientProps<Run>["selection"]>> = {}) =>
  render(
    <DataTable<Run>
      id={TABLE_ID}
      columns={columns}
      data={data}
      pagination={{ show: false }}
      selection={{
        handleSelectRow: vi.fn(),
        isRowSelectable: (row) => !row.archived,
        ...selection,
      }}
    />
  );

const rowCheckbox = (name: string) => within(screen.getByRole("row", { name: new RegExp(name) })).getByRole("checkbox");

describe("DataTable row selection", () => {
  beforeEach(() => {
    localStorage.clear();
    stubResizeObserver();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.className = "";
  });

  it("names the disabled checkbox with the reason and shows it as a tooltip on hover", async () => {
    const user = userEvent.setup();
    renderTable({ getRowUnselectableReason: (row) => (row.archived ? REASON : undefined) });

    const checkbox = screen.getByRole("checkbox", { name: REASON });
    expect(checkbox).toBeDisabled();
    expect(checkbox).toHaveClass("pointer-events-none");

    const wrapper = checkbox.parentElement!;
    expect(wrapper.tagName).toBe("SPAN");
    expect(wrapper).toHaveAttribute("tabindex", "0");
    expect(wrapper).not.toHaveAttribute("aria-label");

    await user.hover(wrapper);

    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent(REASON);
  });

  it("shows the reason tooltip when the wrapper receives keyboard focus", async () => {
    const user = userEvent.setup();
    renderTable({ getRowUnselectableReason: (row) => (row.archived ? REASON : undefined) });

    const wrapper = screen.getByRole("checkbox", { name: REASON }).parentElement!;

    const tabStops = document.querySelectorAll("button, input, [tabindex]").length;
    for (let i = 0; i < tabStops && document.activeElement !== wrapper; i++) {
      await user.tab();
    }
    expect(wrapper).toHaveFocus();

    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent(REASON);
  });

  it("renders a bare disabled checkbox when the unselectable row has no reason", async () => {
    const user = userEvent.setup();
    renderTable();

    const checkbox = rowCheckbox("archived");
    expect(checkbox).toBeDisabled();
    expect(checkbox).not.toHaveClass("pointer-events-none");
    expect(checkbox).not.toHaveAttribute("aria-label");
    expect(checkbox.parentElement?.tagName).toBe("TD");

    await user.hover(checkbox.parentElement!);

    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("does not ask for a reason or wrap the checkbox of a selectable row", async () => {
    const user = userEvent.setup();
    const getRowUnselectableReason = vi.fn(() => REASON);
    renderTable({ getRowUnselectableReason });

    const checkbox = rowCheckbox("live");
    expect(checkbox).toBeEnabled();
    expect(checkbox).not.toHaveAttribute("aria-label");
    expect(checkbox.parentElement?.tagName).toBe("TD");
    expect(getRowUnselectableReason).not.toHaveBeenCalledWith(data[0]);

    await user.hover(checkbox);

    expect(screen.queryByRole("tooltip")).toBeNull();
  });
});
