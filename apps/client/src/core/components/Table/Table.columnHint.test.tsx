import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTable } from "./index";
import { DataTableClientProps, TableColumn } from "./types";
import { stubResizeObserver } from "@/test/utils/resize-observer";

// Reads router state, which this test does not stand up.
vi.mock("@/core/hooks/usePagination", () => ({
  usePagination: vi.fn(() => ({
    page: 0,
    rowsPerPage: 25,
    handleChangePage: vi.fn(),
    handleChangeRowsPerPage: vi.fn(),
  })),
}));

const TABLE_ID = "columnHintTest";

const STATUS_HINT = "The result of the last attempt.";
const ATTEMPTS_HINT = "Attempts of the run, the first included.";

interface Run {
  name: string;
  status: string;
  attempts: number;
}

const columns: TableColumn<Run>[] = [
  {
    id: "name",
    label: "Name",
    data: { render: ({ data }) => data.name, columnSortableValuePath: "name" },
    cell: { baseWidth: 40 },
  },
  {
    id: "status",
    label: "Status",
    hint: STATUS_HINT,
    data: { render: ({ data }) => data.status, columnSortableValuePath: "status" },
    cell: { baseWidth: 30 },
  },
  {
    id: "attempts",
    label: "Attempts",
    hint: ATTEMPTS_HINT,
    data: { render: ({ data }) => data.attempts },
    cell: { baseWidth: 30 },
  },
];

const data: Run[] = [
  { name: "beta", status: "Failed", attempts: 2 },
  { name: "alpha", status: "Succeeded", attempts: 1 },
];

const renderTable = (props: Partial<DataTableClientProps<Run>> = {}) =>
  render(<DataTable<Run> id={TABLE_ID} columns={columns} data={data} pagination={{ show: false }} {...props} />);

describe("column hint", () => {
  beforeEach(() => {
    localStorage.clear();
    stubResizeObserver();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.className = "";
  });

  it("names the column head and its sort button by the label alone", () => {
    renderTable();

    const status = screen.getByRole("columnheader", { name: "Status" });
    expect(within(status).getByRole("button", { name: "Status" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Attempts" })).toBeInTheDocument();
  });

  it("puts the hint button after the sort button, outside it", () => {
    renderTable();

    const status = screen.getByRole("columnheader", { name: "Status" });
    const sortButton = within(status).getByRole("button", { name: "Status" });
    const hintButton = within(status).getByRole("button", { name: "About Status" });

    expect(sortButton.contains(hintButton)).toBe(false);
    expect(sortButton.compareDocumentPosition(hintButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("gives an unsortable hinted column a hint button and no sort button", () => {
    renderTable();

    const attempts = screen.getByRole("columnheader", { name: "Attempts" });
    expect(
      within(attempts)
        .getAllByRole("button")
        .map((button) => button.getAttribute("aria-label"))
    ).toEqual(["About Attempts"]);
  });

  it("shows the hint in a tooltip when the hint button gets keyboard focus", async () => {
    const user = userEvent.setup();
    renderTable();

    const sortButton = screen.getByRole("button", { name: "Status" });
    sortButton.focus();
    await user.tab();

    expect(screen.getByRole("button", { name: "About Status" })).toHaveFocus();
    expect(await screen.findByRole("tooltip")).toHaveTextContent(STATUS_HINT);
  });

  it("does not sort when the hint button is clicked", async () => {
    const user = userEvent.setup();
    renderTable();

    await user.click(screen.getByRole("button", { name: "About Status" }));

    expect(screen.getByRole("columnheader", { name: "Status" })).not.toHaveAttribute("aria-sort");
  });

  it("lists the plain label in the Columns menu, with no hint button", async () => {
    const user = userEvent.setup();
    renderTable();

    await user.click(screen.getByRole("button", { name: /columns/i }));
    const menu = await screen.findByRole("menu");

    expect(within(menu).getByRole("menuitemcheckbox", { name: "Status" })).toHaveTextContent(/^Status$/);
    expect(within(menu).queryByRole("button", { name: "About Status" })).toBeNull();
  });

  it("renders a column with no hint with no hint button and no label id", () => {
    renderTable();

    const name = screen.getByRole("columnheader", { name: "Name" });
    expect(
      within(name)
        .getAllByRole("button")
        .map((button) => button.textContent)
    ).toEqual(["Name"]);
    expect(name).not.toHaveAttribute("aria-labelledby");
  });
});
