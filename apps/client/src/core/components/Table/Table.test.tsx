import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DataTable } from "./index";

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
  TableHead: () => <thead data-testid="table-head" />,
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
