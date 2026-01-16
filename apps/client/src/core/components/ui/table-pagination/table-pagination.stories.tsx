import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { TablePagination } from "./index";

const meta = {
  title: "Core/UI/TablePagination",
  component: TablePagination,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof TablePagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    dataCount: 100,
    page: 0,
    rowsPerPage: 10,
    handleChangePage: () => {},
    handleChangeRowsPerPage: () => {},
  },
  render: () => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    return (
      <TablePagination
        dataCount={100}
        page={page}
        rowsPerPage={rowsPerPage}
        handleChangePage={(_, newPage) => setPage(newPage)}
        handleChangeRowsPerPage={(e) => setRowsPerPage(Number(e.target.value))}
      />
    );
  },
};

export const LargeDataset: Story = {
  args: {
    dataCount: 1000,
    page: 0,
    rowsPerPage: 20,
    handleChangePage: () => {},
    handleChangeRowsPerPage: () => {},
    rowsPerPageOptions: [20, 50, 100, 200],
  },
  render: () => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);

    return (
      <TablePagination
        dataCount={1000}
        page={page}
        rowsPerPage={rowsPerPage}
        handleChangePage={(_, newPage) => setPage(newPage)}
        handleChangeRowsPerPage={(e) => setRowsPerPage(Number(e.target.value))}
        rowsPerPageOptions={[20, 50, 100, 200]}
      />
    );
  },
};
