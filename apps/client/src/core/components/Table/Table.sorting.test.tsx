import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTable } from "./index";
import { DataTableClientProps, TableColumn } from "./types";
import { stubResizeObserver } from "@/test/utils/resize-observer";

/**
 * DOM-level coverage of sorting through the real shell and the real header:
 * default order, the click cycle, and the active-column indicator.
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

const TABLE_ID = "sortingTest";

interface Run {
  name: string;
  startedAt?: string;
}

const columns: TableColumn<Run>[] = [
  {
    id: "name",
    label: "Name",
    data: { render: ({ data }) => data.name, columnSortableValuePath: "name" },
    cell: { baseWidth: 50 },
  },
  {
    id: "startedAt",
    label: "Started at",
    data: { render: ({ data }) => data.startedAt ?? "-", columnSortableValuePath: "startedAt" },
    cell: { baseWidth: 30 },
  },
  {
    id: "actions",
    label: "Actions",
    data: { render: () => "…" },
    cell: { baseWidth: 20 },
  },
];

const data: Run[] = [
  { name: "beta", startedAt: "2026-09-10T10:00:00Z" },
  { name: "alpha", startedAt: "2026-09-10T12:00:00Z" },
  { name: "gamma", startedAt: "2026-09-10T11:00:00Z" },
];

const renderTable = (props: Partial<DataTableClientProps<Run>> = {}) =>
  render(<DataTable<Run> id={TABLE_ID} columns={columns} data={data} pagination={{ show: false }} {...props} />);

/** First cell of each body row, in render order. */
const renderedNames = () =>
  screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[0].textContent);

const header = (name: RegExp) => screen.getByRole("columnheader", { name });

describe("DataTable sorting", () => {
  beforeEach(() => {
    localStorage.clear();
    stubResizeObserver();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.className = "";
  });

  it("keeps source order when the caller sets no sort", () => {
    renderTable();

    expect(renderedNames()).toEqual(["beta", "alpha", "gamma"]);
  });

  it("does not warn when no sort is set, only when a named column is missing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    renderTable();
    expect(warn).not.toHaveBeenCalled();

    renderTable({ sort: { sortBy: "nonexistent", order: "asc" } });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("nonexistent"));

    warn.mockRestore();
  });

  it("applies the caller's default sort column and direction", () => {
    renderTable({ sort: { sortBy: "startedAt", order: "desc" } });

    expect(renderedNames()).toEqual(["alpha", "gamma", "beta"]);
  });

  it("marks the default sorted column as active in the header", () => {
    renderTable({ sort: { sortBy: "startedAt", order: "desc" } });

    expect(header(/started at/i)).toHaveAttribute("aria-sort", "descending");
    // Only the sorted header carries aria-sort.
    expect(header(/^name$/i)).not.toHaveAttribute("aria-sort");
  });

  it("leaves a non-sortable column without a sort affordance", () => {
    renderTable();

    expect(header(/actions/i)).not.toHaveAttribute("aria-sort");
    expect(within(header(/actions/i)).queryByRole("button")).not.toBeInTheDocument();
  });

  it("flips a clicked column between ascending and descending", async () => {
    const user = userEvent.setup();
    renderTable();

    await user.click(within(header(/started at/i)).getByRole("button"));
    expect(renderedNames()).toEqual(["beta", "gamma", "alpha"]);
    expect(header(/started at/i)).toHaveAttribute("aria-sort", "ascending");

    await user.click(within(header(/started at/i)).getByRole("button"));
    expect(renderedNames()).toEqual(["alpha", "gamma", "beta"]);
    expect(header(/started at/i)).toHaveAttribute("aria-sort", "descending");

    await user.click(within(header(/started at/i)).getByRole("button"));
    expect(renderedNames()).toEqual(["beta", "gamma", "alpha"]);
    expect(header(/started at/i)).toHaveAttribute("aria-sort", "ascending");
  });

  it("flips a descending default on the first click rather than appearing to do nothing", async () => {
    const user = userEvent.setup();
    renderTable({ sort: { sortBy: "startedAt", order: "desc" } });

    await user.click(within(header(/started at/i)).getByRole("button"));

    expect(header(/started at/i)).toHaveAttribute("aria-sort", "ascending");
    expect(renderedNames()).toEqual(["beta", "gamma", "alpha"]);
  });

  it("starts a newly clicked column at ascending rather than inheriting the previous direction", async () => {
    const user = userEvent.setup();
    renderTable({ sort: { sortBy: "startedAt", order: "desc" } });

    await user.click(within(header(/^name$/i)).getByRole("button"));

    expect(renderedNames()).toEqual(["alpha", "beta", "gamma"]);
    expect(header(/^name$/i)).toHaveAttribute("aria-sort", "ascending");
    expect(header(/started at/i)).not.toHaveAttribute("aria-sort");
  });

  it("ranks rows with no value last in both directions", async () => {
    const user = userEvent.setup();
    const withPending: Run[] = [...data, { name: "pending" }];
    renderTable({ data: withPending, sort: { sortBy: "startedAt", order: "desc" } });

    expect(renderedNames()).toEqual(["alpha", "gamma", "beta", "pending"]);

    await user.click(within(header(/started at/i)).getByRole("button"));

    expect(header(/started at/i)).toHaveAttribute("aria-sort", "ascending");
    expect(renderedNames()).toEqual(["beta", "gamma", "alpha", "pending"]);
  });

  it("applies no sort by a hidden column, so no order exists without a header to show it", () => {
    const hiddenStartedAt = columns.map((column) =>
      column.id === "startedAt" ? { ...column, cell: { ...column.cell, show: false } } : column
    );
    renderTable({ columns: hiddenStartedAt, sort: { sortBy: "startedAt", order: "desc" } });

    expect(renderedNames()).toEqual(["beta", "alpha", "gamma"]);
    expect(screen.queryByRole("columnheader", { name: /started at/i })).not.toBeInTheDocument();
    expect(header(/^name$/i)).not.toHaveAttribute("aria-sort");
  });

  it("keeps a pinned row first when the column is flipped to descending", async () => {
    const user = userEvent.setup();
    const isRowPinned = (row: Run) => row.name === "gamma";
    renderTable({ isRowPinned, sort: { sortBy: "name", order: "asc" } });

    expect(renderedNames()).toEqual(["gamma", "alpha", "beta"]);

    await user.click(within(header(/^name$/i)).getByRole("button"));

    expect(header(/^name$/i)).toHaveAttribute("aria-sort", "descending");
    expect(renderedNames()).toEqual(["gamma", "beta", "alpha"]);
  });
});
