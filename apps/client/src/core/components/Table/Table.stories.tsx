import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box } from "lucide-react";
import { withAppProviders } from "@sb/index";
import { DataTable } from "./index";
import { TableColumn } from "./types";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { CellExternalLink } from "./components/CellLink";

/**
 * `.tsx` is excluded from Vitest coverage; these stories are the visual check for the drag.
 *
 * Try in each story: drag a column edge, double-click an edge to reset that column, use
 * the Columns dropdown to reset every width. Widths persist per `id` in localStorage, so
 * each story has its own id.
 */

type Run = {
  name: string;
  status: string;
  pipeline: string;
  branch: string;
  startedAt: string;
  attempts: number;
};

const rows: Run[] = Array.from({ length: 12 }, (_, index) => ({
  name: `customer-portal-frontend-build-main-${(1000000 + index * 7919).toString(16)}-2026-09-0${(index % 9) + 1}-run-${String(index).padStart(4, "0")}`,
  status: index % 4 === 0 ? "Failed" : "Succeeded",
  pipeline: "customer-portal-frontend-build-npm-nextjs-edp",
  branch: index % 3 === 0 ? "feature/a-rather-long-branch-name-for-testing" : "main",
  startedAt: `03 Sep 2026, 1${index % 10}:0${index % 6}`,
  attempts: (index % 5) + 1,
}));

const text = (value: string | number) => <TextWithTooltip text={value} />;

const column = (
  id: keyof Run,
  label: string,
  baseWidth: number,
  cell: Partial<TableColumn<Run>["cell"]> = {}
): TableColumn<Run> => ({
  id,
  label,
  data: { render: ({ data }) => text(data[id]) },
  cell: { baseWidth, ...cell },
});

/** Sums to 100. */
const balanced: TableColumn<Run>[] = [
  column("name", "Run", 40),
  column("status", "Status", 15),
  column("pipeline", "Pipeline", 20),
  column("branch", "Branch", 15),
  column("startedAt", "Started at", 10),
];

/** Sums below 100. Seeds normalise against the visible sum. */
const sumBelowHundred: TableColumn<Run>[] = [
  column("name", "Run", 20),
  column("status", "Status", 10),
  column("pipeline", "Pipeline", 15),
  column("startedAt", "Age", 13),
];

/** Sums above 100. */
const sumAboveHundred: TableColumn<Run>[] = [
  column("name", "Run", 40),
  column("status", "Status", 33),
  column("pipeline", "Pipeline", 30),
  column("branch", "Branch", 30),
  column("startedAt", "Started at", 20),
];

const meta = {
  title: "Core/Components/Table",
  component: DataTable<Run>,
  parameters: { layout: "fullscreen" },
  decorators: [withAppProviders()],
  args: {
    data: rows,
    columns: balanced,
    pagination: { show: false },
  },
} satisfies Meta<typeof DataTable<Run>>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Long values clip until you widen the column; the tooltip disappears when the text fits. */
export const Default: Story = {
  args: { id: "sb-table-default" },
};

/**
 * A column set summing to 58. Every column should still take its proportional share and
 * the row should fill the container — the seed denominator is the visible sum, not 100.
 */
export const SumBelowHundred: Story = {
  args: { id: "sb-table-sum-58", columns: sumBelowHundred },
};

/** A column set summing to 153. Should fill the container, not overflow it on load. */
export const SumAboveHundred: Story = {
  args: { id: "sb-table-sum-153", columns: sumAboveHundred },
};

/** `Status` opts out with `resizable: false`, so it has no handle but still reflows. */
export const NonResizableColumn: Story = {
  args: {
    id: "sb-table-non-resizable",
    columns: [
      column("name", "Run", 40),
      column("status", "Status", 15, { resizable: false }),
      column("pipeline", "Pipeline", 20),
      column("branch", "Branch", 15),
      column("startedAt", "Started at", 10),
    ],
  },
};

/** `Pipeline` starts hidden; its share goes to the others, and its width returns on re-show. */
export const HiddenColumn: Story = {
  args: {
    id: "sb-table-hidden",
    columns: [
      column("name", "Run", 40),
      column("status", "Status", 15),
      column("pipeline", "Pipeline", 20, { show: false }),
      column("branch", "Branch", 15),
      column("startedAt", "Started at", 10),
    ],
  },
};

/** `Status` cannot go below 200px. Drag its edge left to see the floor bind. */
/**
 * No-wrap text inside a nested flex box, the shape the Pull Request title uses. Drag the
 * Run edge left: the text must clip at the column edge, never paint over Status.
 */
export const NoWrapCellContent: Story = {
  args: {
    id: "sb-table-nowrap-cell",
    columns: [
      {
        ...column("name", "Run", 20),
        data: {
          render: ({ data }) => (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">{data.name}</span>
              </div>
              <span className="text-muted-foreground text-xs">by dependabot[bot]</span>
            </div>
          ),
        },
      },
      column("status", "Status", 15),
      column("pipeline", "Pipeline", 30),
      column("branch", "Branch", 20),
      column("startedAt", "Started at", 15),
    ],
  },
};

/** The Run column through `CellExternalLink`. Drag its edge: the ellipsis and tooltip work inside the link. */
export const CellLinkColumn: Story = {
  args: {
    id: "sb-table-cell-link",
    columns: [
      {
        ...column("name", "Run", 40),
        data: { render: ({ data }) => <CellExternalLink href="#" icon={Box} text={data.name} /> },
      },
      column("status", "Status", 15),
      column("pipeline", "Pipeline", 20),
      column("branch", "Branch", 15),
      column("startedAt", "Started at", 10),
    ],
  },
};

/**
 * Run and Status return raw strings, no `TextWithTooltip` call at the page. Narrow either
 * one: the shell default clamps and shows a tooltip on its own. Attempts returns a raw
 * number, right-aligned through `cell.props.align`; the alignment holds at any width.
 */
export const PrimitiveCells: Story = {
  args: {
    id: "sb-table-primitive-cells",
    columns: [
      { id: "name", label: "Run", data: { render: ({ data }) => data.name }, cell: { baseWidth: 40 } },
      { id: "status", label: "Status", data: { render: ({ data }) => data.status }, cell: { baseWidth: 15 } },
      column("pipeline", "Pipeline", 20),
      column("branch", "Branch", 15),
      {
        id: "attempts",
        label: "Attempts",
        data: { render: ({ data }) => data.attempts },
        cell: { baseWidth: 10, props: { align: "right" } },
      },
    ],
  },
};

export const CustomMinWidth: Story = {
  args: {
    id: "sb-table-min-width",
    columns: [
      column("name", "Run", 40),
      column("status", "Status", 15, { minWidth: 200 }),
      column("pipeline", "Pipeline", 20),
      column("branch", "Branch", 15),
      column("startedAt", "Started at", 10),
    ],
  },
};

/** Both leading columns present. Neither shows a handle; the colgroup must stay aligned. */
export const WithSelectionAndExpandable: Story = {
  args: {
    id: "sb-table-leading-columns",
    selection: {
      selected: [],
      handleSelectRow: () => {},
      handleSelectAll: () => {},
      isRowSelected: () => false,
    },
    expandable: {
      expandedRowRender: (row) => <div className="p-4 text-sm">Details for {row.name}</div>,
      getRowId: (row) => row.name,
    },
  },
};

/** Resize a column, then drag the browser edge: the resized one holds, the rest reflow. */
export const ContainerResize: Story = {
  args: { id: "sb-table-container-resize" },
  render: (args) => (
    <div className="min-w-[600px] resize-x overflow-auto border border-dashed p-2">
      <DataTable<Run> {...args} />
    </div>
  ),
};

/** Narrow viewport: no handles render, so a horizontal swipe is not swallowed on touch. */
export const NarrowViewport: Story = {
  args: { id: "sb-table-narrow" },
  parameters: { viewport: { defaultViewport: "mobile2" } },
};

export const Loading: Story = {
  args: { id: "sb-table-loading", isLoading: true },
};

export const Empty: Story = {
  args: { id: "sb-table-empty", data: [] },
};
