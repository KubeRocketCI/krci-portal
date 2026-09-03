import type { Meta, StoryObj } from "@storybook/react-vite";
import { withAppProviders } from "@sb/index";
import { ServerSideTable } from "./index";
import { TableColumn } from "@/core/components/Table/types";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";

/**
 * This shell has no selection column, so the space the data columns share is the
 * container minus only the expand column. Resizing behaves exactly as in `DataTable`,
 * including that a width survives a server-side page change.
 */

type Project = {
  name: string;
  version: string;
  risk: string;
  lastScan: string;
};

const rows: Project[] = Array.from({ length: 10 }, (_, index) => ({
  name: `payments-reconciliation-service-component-${index}-with-a-long-identifier`,
  version: `2.${index}.0-SNAPSHOT`,
  risk: index % 3 === 0 ? "Critical" : "Low",
  lastScan: `03 Sep 2026, 1${index % 10}:00`,
}));

const column = (id: keyof Project, label: string, baseWidth: number): TableColumn<Project> => ({
  id,
  label,
  data: { render: ({ data }) => <TextWithTooltip text={data[id]} /> },
  cell: { baseWidth },
});

/** Sums above 100. */
const columns: TableColumn<Project>[] = [
  column("name", "Project", 60),
  column("version", "Version", 33),
  column("risk", "Risk", 30),
  column("lastScan", "Last scan", 30),
];

const meta = {
  title: "Core/Components/ServerSideTable",
  component: ServerSideTable<Project>,
  parameters: { layout: "fullscreen" },
  decorators: [withAppProviders()],
  args: {
    data: rows,
    columns,
    pagination: {
      show: true,
      page: 0,
      rowsPerPage: 10,
      totalCount: 120,
      onPageChange: () => {},
      onRowsPerPageChange: () => {},
    },
  },
} satisfies Meta<typeof ServerSideTable<Project>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { id: "sb-server-table-default" },
};

/** No Columns dropdown, so double-click on a handle is the only reset. */
export const WithoutSettings: Story = {
  args: { id: "sb-server-table-no-settings", settings: { show: false } },
};

export const Loading: Story = {
  args: { id: "sb-server-table-loading", isLoading: true },
};
