import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DataTable } from "./index";

const tableHeadColumnsSpy = vi.fn();

// Mock usePagination hook
vi.mock("@/core/hooks/usePagination", () => ({
  usePagination: vi.fn(() => ({
    page: 0,
    rowsPerPage: 25,
    handleChangePage: vi.fn(),
    handleChangeRowsPerPage: vi.fn(),
  })),
}));

// Mock components
vi.mock("@/core/components/ui/table", () => ({
  TableUI: ({ children }: { children: React.ReactNode }) => <table>{children}</table>,
}));

vi.mock("./components/TableHead", () => ({
  TableHead: ({ columns }: { columns: { id: string }[] }) => {
    tableHeadColumnsSpy(columns);
    return <thead data-testid="table-head" />;
  },
}));

vi.mock("./components/TableBody", () => ({
  TableBody: ({ data, emptyListComponent }: { data: unknown; emptyListComponent: React.ReactNode }) => (
    <tbody data-testid="table-body">
      {(!data || (Array.isArray(data) && data.length === 0)) && emptyListComponent}
    </tbody>
  ),
}));

vi.mock("./components/TablePagination", () => ({
  TablePagination: () => <div data-testid="pagination" />,
}));

describe("DataTable - Page Out of Bounds", () => {
  const mockColumns = [
    {
      id: "name",
      label: "Name",
      data: {
        render: ({ data }: { data: { name: string } }) => data.name,
      },
      cell: {
        show: true,
        baseWidth: 50,
      },
    },
  ];

  const mockData = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
  }));

  it("should show 'Page not found' message when page is beyond total pages", async () => {
    const { usePagination } = await import("@/core/hooks/usePagination");
    // User is on page 5 (0-indexed) but only 2 pages of data exist (50 items / 25 per page)
    vi.mocked(usePagination).mockReturnValue({
      page: 5,
      rowsPerPage: 25,
      handleChangePage: vi.fn(),
      handleChangeRowsPerPage: vi.fn(),
    });

    render(<DataTable id="test-table" data={mockData} columns={mockColumns} pagination={{ show: true }} />);

    expect(screen.getByText("Page not found")).toBeInTheDocument();
    expect(screen.getByText("The requested page does not exist. Please navigate to a valid page.")).toBeInTheDocument();
  });

  it("should NOT show 'Page not found' when page is valid", async () => {
    const { usePagination } = await import("@/core/hooks/usePagination");
    vi.mocked(usePagination).mockReturnValue({
      page: 0,
      rowsPerPage: 25,
      handleChangePage: vi.fn(),
      handleChangeRowsPerPage: vi.fn(),
    });

    render(<DataTable id="test-table" data={mockData} columns={mockColumns} pagination={{ show: true }} />);

    expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
  });

  it("should show 'Page not found' when on page 3 with only 26 items and 25 per page", async () => {
    const { usePagination } = await import("@/core/hooks/usePagination");
    // 26 items with 25 per page = 2 pages (page 0 and page 1)
    // Page 2 is out of bounds
    vi.mocked(usePagination).mockReturnValue({
      page: 2,
      rowsPerPage: 25,
      handleChangePage: vi.fn(),
      handleChangeRowsPerPage: vi.fn(),
    });

    const smallDataset = Array.from({ length: 26 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
    }));

    render(<DataTable id="test-table" data={smallDataset} columns={mockColumns} pagination={{ show: true }} />);

    expect(screen.getByText("Page not found")).toBeInTheDocument();
  });

  it("should NOT show error when on the last valid page", async () => {
    const { usePagination } = await import("@/core/hooks/usePagination");
    // 26 items with 25 per page = 2 pages (0-indexed: page 0 and page 1)
    vi.mocked(usePagination).mockReturnValue({
      page: 1, // Last valid page
      rowsPerPage: 25,
      handleChangePage: vi.fn(),
      handleChangeRowsPerPage: vi.fn(),
    });

    const smallDataset = Array.from({ length: 26 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
    }));

    render(<DataTable id="test-table" data={smallDataset} columns={mockColumns} pagination={{ show: true }} />);

    expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
  });

  it("should NOT show error when data is empty", async () => {
    const { usePagination } = await import("@/core/hooks/usePagination");
    vi.mocked(usePagination).mockReturnValue({
      page: 0,
      rowsPerPage: 25,
      handleChangePage: vi.fn(),
      handleChangeRowsPerPage: vi.fn(),
    });

    render(<DataTable id="test-table" data={[]} columns={mockColumns} pagination={{ show: true }} />);

    expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
  });

  it("should handle filtered data resulting in fewer pages", async () => {
    const { usePagination } = await import("@/core/hooks/usePagination");
    // User was on page 2, but after filtering only 10 items remain
    vi.mocked(usePagination).mockReturnValue({
      page: 2,
      rowsPerPage: 25,
      handleChangePage: vi.fn(),
      handleChangeRowsPerPage: vi.fn(),
    });

    const filteredData = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `Filtered Item ${i + 1}`,
    }));

    render(<DataTable id="test-table" data={filteredData} columns={mockColumns} pagination={{ show: true }} />);

    expect(screen.getByText("Page not found")).toBeInTheDocument();
  });

  it("should show custom empty component when provided and not out of bounds", async () => {
    const { usePagination } = await import("@/core/hooks/usePagination");
    vi.mocked(usePagination).mockReturnValue({
      page: 0,
      rowsPerPage: 25,
      handleChangePage: vi.fn(),
      handleChangeRowsPerPage: vi.fn(),
    });

    const customEmpty = <div data-testid="custom-empty">No data available</div>;

    render(
      <DataTable
        id="test-table"
        data={[]}
        columns={mockColumns}
        emptyListComponent={customEmpty}
        pagination={{ show: true }}
      />
    );

    expect(screen.getByTestId("custom-empty")).toBeInTheDocument();
    expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
  });

  it("should NOT show 'Page not found' when pagination.show is false, even when URL ?page is out of range", async () => {
    const { usePagination } = await import("@/core/hooks/usePagination");
    // usePagination still reads ?page=5 from the URL via strict:false; we expect
    // the table to ignore it and render the full dataset since pagination is hidden.
    vi.mocked(usePagination).mockReturnValue({
      page: 5,
      rowsPerPage: 25,
      handleChangePage: vi.fn(),
      handleChangeRowsPerPage: vi.fn(),
    });

    render(<DataTable id="test-table" data={mockData} columns={mockColumns} pagination={{ show: false }} />);

    expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
  });

  it("should NOT show error with very small rowsPerPage", async () => {
    const { usePagination } = await import("@/core/hooks/usePagination");
    // 10 items with 5 per page = 2 pages (page 0 and page 1)
    vi.mocked(usePagination).mockReturnValue({
      page: 1,
      rowsPerPage: 5,
      handleChangePage: vi.fn(),
      handleChangeRowsPerPage: vi.fn(),
    });

    const smallData = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
    }));

    render(<DataTable id="test-table" data={smallData} columns={mockColumns} pagination={{ show: true }} />);

    expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
  });
});

describe("DataTable - columns prop sync", () => {
  it("renders the latest columns prop when the parent passes a new reference", async () => {
    const { usePagination } = await import("@/core/hooks/usePagination");
    vi.mocked(usePagination).mockReturnValue({
      page: 0,
      rowsPerPage: 25,
      handleChangePage: vi.fn(),
      handleChangeRowsPerPage: vi.fn(),
    });

    const columnsA = [
      {
        id: "name",
        label: "Name",
        data: { render: ({ data }: { data: { name: string } }) => data.name },
        cell: { show: true, baseWidth: 50 },
      },
    ];
    const columnsB = [
      {
        id: "name",
        label: "Name",
        data: { render: ({ data }: { data: { name: string } }) => data.name },
        cell: { show: true, baseWidth: 50 },
      },
      {
        id: "provisioner",
        label: "Provisioner",
        data: { render: () => "p" },
        cell: { show: true, baseWidth: 20 },
      },
    ];

    tableHeadColumnsSpy.mockClear();

    const { rerender } = render(<DataTable id="test-table" data={[]} columns={columnsA} />);
    const initialColumns = tableHeadColumnsSpy.mock.calls.at(-1)?.[0];
    expect(initialColumns).toHaveLength(1);

    rerender(<DataTable id="test-table" data={[]} columns={columnsB} />);
    const updatedColumns = tableHeadColumnsSpy.mock.calls.at(-1)?.[0];
    expect(updatedColumns).toHaveLength(2);
    expect(updatedColumns.map((c: { id: string }) => c.id)).toEqual(["name", "provisioner"]);
  });

  it("passes a fresh same-id columns array through to TableHead, so render closures follow the parent", () => {
    const columnsInitial = [
      {
        id: "name",
        label: "Name",
        data: { render: ({ data }: { data: { name: string } }) => data.name },
        cell: { show: true, baseWidth: 50 },
      },
    ];
    const columnsFreshReference = [
      {
        id: "name",
        label: "Name",
        data: { render: ({ data }: { data: { name: string } }) => data.name },
        cell: { show: true, baseWidth: 50 },
      },
    ];

    tableHeadColumnsSpy.mockClear();

    const { rerender } = render(<DataTable id="test-table" data={[]} columns={columnsInitial} />);
    expect(tableHeadColumnsSpy.mock.calls.at(-1)?.[0]).toBe(columnsInitial);

    rerender(<DataTable id="test-table" data={[]} columns={columnsFreshReference} />);
    expect(tableHeadColumnsSpy.mock.calls.at(-1)?.[0]).toBe(columnsFreshReference);
  });
});

describe("DataTable - selection bar", () => {
  const columns = [
    {
      id: "name",
      label: "Name",
      data: { render: ({ data }: { data: { id: number; name: string } }) => data.name },
      cell: { show: true, baseWidth: 50 },
    },
  ];

  const data = [
    { id: 1, name: "first" },
    { id: 2, name: "second" },
  ];

  it("renders the selected count and the caller's actions while a row is selected", () => {
    render(
      <DataTable
        id="selection-table"
        data={data}
        columns={columns}
        selection={{
          selected: ["1"],
          isRowSelected: (row) => row.id === 1,
          renderSelectionActions: (selectedCount) => <button>Act on {selectedCount}</button>,
        }}
      />
    );

    expect(screen.getByText("1 item(s) selected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Act on 1" })).toBeInTheDocument();
  });

  it("renders no selection bar while no row is selected", () => {
    render(
      <DataTable
        id="selection-table"
        data={data}
        columns={columns}
        selection={{
          selected: [],
          isRowSelected: () => false,
          renderSelectionActions: () => <button>Act</button>,
        }}
      />
    );

    expect(screen.queryByText(/item\(s\) selected/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Act" })).not.toBeInTheDocument();
  });

  it("renders no selection bar while the selected rows are gone from the data", () => {
    render(
      <DataTable
        id="selection-table"
        data={[]}
        columns={columns}
        selection={{
          selected: ["1", "2"],
          isRowSelected: () => true,
          renderSelectionActions: () => <button>Act</button>,
        }}
      />
    );

    expect(screen.queryByText(/item\(s\) selected/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Act" })).not.toBeInTheDocument();
  });
});
