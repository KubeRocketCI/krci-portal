import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTable } from "./index";
import { Row, column } from "./testUtils";
import { stubResizeObserver } from "@/test/utils/resize-observer";

/**
 * Real `TableBody` and real pager: asserts on rendered rows, the range label and the
 * pager buttons through the shell.
 */

// Reads router state, which this test does not stand up. Server mode must not consult it.
const paginationState = vi.hoisted(() => ({ page: 0, rowsPerPage: 25 }));

vi.mock("@/core/hooks/usePagination", () => ({
  usePagination: vi.fn(() => ({
    page: paginationState.page,
    rowsPerPage: paginationState.rowsPerPage,
    handleChangePage: vi.fn(),
    handleChangeRowsPerPage: vi.fn(),
  })),
}));

const columns = [column("name", 100)];

const rows = (count: number): Row[] => Array.from({ length: count }, (_, i) => ({ name: "Item " + (i + 1) }));

const range = () => screen.getByTestId("table-pagination-range");
const button = (name: string) => screen.getByRole("button", { name });
const queryButton = (name: string) => screen.queryByRole("button", { name });

describe("DataTable server mode", () => {
  beforeEach(() => {
    localStorage.clear();
    stubResizeObserver();
    paginationState.page = 0;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders every row of the page without client slicing", () => {
    render(
      <DataTable<Row>
        id="server"
        columns={columns}
        data={rows(12)}
        mode="server"
        pagination={{ page: 1, rowsPerPage: 10, totalCount: 22, onPageChange: vi.fn() }}
      />
    );

    expect(screen.getByText("Item 12")).toBeInTheDocument();
  });

  it("ignores usePagination state", () => {
    paginationState.page = 5;

    render(
      <DataTable<Row>
        id="server"
        columns={columns}
        data={rows(3)}
        mode="server"
        pagination={{ page: 0, rowsPerPage: 10, totalCount: 3, onPageChange: vi.fn() }}
      />
    );

    expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
    expect(screen.getByText("Item 3")).toBeInTheDocument();
  });

  it("known total: renders the range and enables Next and Last before the last page", () => {
    render(
      <DataTable<Row>
        id="server"
        columns={columns}
        data={rows(10)}
        mode="server"
        pagination={{ page: 0, rowsPerPage: 10, totalCount: 25, onPageChange: vi.fn() }}
      />
    );

    expect(range()).toHaveTextContent("1-10 of 25");
    expect(button("First page")).toBeDisabled();
    expect(button("Previous page")).toBeDisabled();
    expect(button("Next page")).toBeEnabled();
    expect(button("Last page")).toBeEnabled();
  });

  it("known total: disables Next and Last on the last page", () => {
    render(
      <DataTable<Row>
        id="server"
        columns={columns}
        data={rows(5)}
        mode="server"
        pagination={{ page: 2, rowsPerPage: 10, totalCount: 25, onPageChange: vi.fn() }}
      />
    );

    expect(range()).toHaveTextContent("21-25 of 25");
    expect(button("Next page")).toBeDisabled();
    expect(button("Last page")).toBeDisabled();
    expect(button("First page")).toBeEnabled();
    expect(button("Previous page")).toBeEnabled();
  });

  it("loading: renders an ellipsis and disables Next and Last when totalCount is undefined", () => {
    render(
      <DataTable<Row>
        id="server"
        columns={columns}
        data={[]}
        isLoading
        mode="server"
        pagination={{ page: 0, rowsPerPage: 10, totalCount: undefined, onPageChange: vi.fn() }}
      />
    );

    expect(range()).toHaveTextContent("…");
    expect(button("Next page")).toBeDisabled();
    expect(button("Last page")).toBeDisabled();
  });

  it("treats an invalid totalCount as loading, not out of bounds", () => {
    render(
      <DataTable<Row>
        id="server"
        columns={columns}
        data={rows(3)}
        mode="server"
        pagination={{ page: 0, rowsPerPage: 10, totalCount: -1, onPageChange: vi.fn() }}
      />
    );

    expect(screen.getByText("Item 3")).toBeInTheDocument();
    expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
    expect(range()).toHaveTextContent("…");
    expect(button("Next page")).toBeDisabled();
    expect(button("Last page")).toBeDisabled();
  });

  it("cursor: labels the range from pageItemCount and omits First and Last", () => {
    render(
      <DataTable<Row>
        id="server"
        columns={columns}
        data={rows(7)}
        mode="server"
        pagination={{ page: 1, rowsPerPage: 10, hasNextPage: true, onPageChange: vi.fn() }}
      />
    );

    expect(range()).toHaveTextContent("11-17 of many");
    expect(queryButton("First page")).toBeNull();
    expect(queryButton("Last page")).toBeNull();
    expect(button("Previous page")).toBeEnabled();
  });

  it("cursor: enables Next only when hasNextPage is true", () => {
    const { rerender } = render(
      <DataTable<Row>
        id="server"
        columns={columns}
        data={rows(10)}
        mode="server"
        pagination={{ page: 0, rowsPerPage: 10, hasNextPage: true, onPageChange: vi.fn() }}
      />
    );
    expect(button("Next page")).toBeEnabled();

    rerender(
      <DataTable<Row>
        id="server"
        columns={columns}
        data={rows(10)}
        mode="server"
        pagination={{ page: 0, rowsPerPage: 10, hasNextPage: false, onPageChange: vi.fn() }}
      />
    );
    expect(button("Next page")).toBeDisabled();
  });

  it("cursor: never shows 'Page not found'", () => {
    render(
      <DataTable<Row>
        id="server"
        columns={columns}
        data={[]}
        mode="server"
        emptyListComponent={<div>Nothing here</div>}
        pagination={{ page: 99, rowsPerPage: 10, hasNextPage: false, onPageChange: vi.fn() }}
      />
    );

    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
  });

  it("rows-per-page change emits onRowsPerPageChange once and never onPageChange", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    const onRowsPerPageChange = vi.fn();

    render(
      <DataTable<Row>
        id="server"
        columns={columns}
        data={rows(10)}
        mode="server"
        pagination={{ page: 2, rowsPerPage: 10, totalCount: 100, onPageChange, onRowsPerPageChange }}
      />
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "20" }));

    expect(onRowsPerPageChange).toHaveBeenCalledTimes(1);
    expect(onRowsPerPageChange).toHaveBeenCalledWith(20);
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("server mode without onRowsPerPageChange renders no rows-per-page select and never emits onPageChange(0)", () => {
    const onPageChange = vi.fn();

    render(
      <DataTable<Row>
        id="server"
        columns={columns}
        data={rows(10)}
        mode="server"
        pagination={{ page: 2, rowsPerPage: 10, totalCount: 100, onPageChange }}
      />
    );

    expect(range()).toHaveTextContent("21-30 of 100");
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.queryByText("Rows per page:")).toBeNull();
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("does not show 'Page not found' when pagination.show is false", () => {
    render(
      <DataTable<Row>
        id="server"
        columns={columns}
        data={rows(3)}
        mode="server"
        pagination={{ show: false, page: 99, rowsPerPage: 10, totalCount: 3, onPageChange: vi.fn() }}
      />
    );

    expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.getByText("Item 3")).toBeInTheDocument();
  });

  it("never calls filterFunction in server mode", () => {
    const spy = vi.fn(() => false);

    render(
      // @ts-expect-error filterFunction is not accepted in server mode
      <DataTable<Row>
        id="server"
        columns={columns}
        data={rows(3)}
        mode="server"
        pagination={{ page: 0, rowsPerPage: 10, totalCount: 3, onPageChange: vi.fn() }}
        filterFunction={spy}
      />
    );

    expect(spy).not.toHaveBeenCalled();
    expect(screen.getByText("Item 1")).toBeInTheDocument();
  });

  it("rejects selection in server mode (type-only; never rendered)", () => {
    const element = (
      // @ts-expect-error selection is not accepted in server mode
      <DataTable<Row>
        id="server"
        columns={columns}
        data={rows(3)}
        mode="server"
        pagination={{ page: 0, rowsPerPage: 10, totalCount: 3, onPageChange: vi.fn() }}
        selection={{ selected: [] }}
      />
    );

    expect(element).toBeDefined();
  });

  describe("page out of bounds", () => {
    it("server mode: shows 'Page not found' when page is beyond total pages", () => {
      render(
        <DataTable<Row>
          id="server"
          columns={columns}
          data={rows(3)}
          mode="server"
          pagination={{ page: 5, rowsPerPage: 25, totalCount: 3, onPageChange: vi.fn() }}
        />
      );

      expect(screen.getByText("Page not found")).toBeInTheDocument();
      expect(
        screen.getByText("The requested page does not exist. Please navigate to a valid page.")
      ).toBeInTheDocument();
    });

    it("server mode: does NOT show 'Page not found' when page is valid", () => {
      render(
        <DataTable<Row>
          id="server"
          columns={columns}
          data={rows(3)}
          mode="server"
          pagination={{ page: 0, rowsPerPage: 25, totalCount: 3, onPageChange: vi.fn() }}
        />
      );

      expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
    });

    it("server mode: shows 'Page not found' on page 2 with 10 total items and 25 per page", () => {
      render(
        <DataTable<Row>
          id="server"
          columns={columns}
          data={[]}
          mode="server"
          pagination={{ page: 1, rowsPerPage: 25, totalCount: 10, onPageChange: vi.fn() }}
        />
      );

      expect(screen.getByText("Page not found")).toBeInTheDocument();
    });

    it("server mode: does NOT show error when totalCount is 0", () => {
      render(
        <DataTable<Row>
          id="server"
          columns={columns}
          data={[]}
          mode="server"
          pagination={{ page: 0, rowsPerPage: 25, totalCount: 0, onPageChange: vi.fn() }}
        />
      );

      expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
    });

    it("server mode: shows error one page past a 26-item total at 25 per page", () => {
      render(
        <DataTable<Row>
          id="server"
          columns={columns}
          data={[]}
          mode="server"
          pagination={{ page: 2, rowsPerPage: 25, totalCount: 26, onPageChange: vi.fn() }}
        />
      );

      expect(screen.getByText("Page not found")).toBeInTheDocument();
    });

    it("server mode: does NOT show error on the exact last page", () => {
      render(
        <DataTable<Row>
          id="server"
          columns={columns}
          data={rows(1)}
          mode="server"
          pagination={{ page: 1, rowsPerPage: 25, totalCount: 26, onPageChange: vi.fn() }}
        />
      );

      expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
    });

    it("server mode: shows the custom empty component when not out of bounds", () => {
      render(
        <DataTable<Row>
          id="server"
          columns={columns}
          data={[]}
          mode="server"
          emptyListComponent={<div data-testid="custom-empty">No data available</div>}
          pagination={{ page: 0, rowsPerPage: 25, totalCount: 0, onPageChange: vi.fn() }}
        />
      );

      expect(screen.getByTestId("custom-empty")).toBeInTheDocument();
      expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
    });
  });
});
