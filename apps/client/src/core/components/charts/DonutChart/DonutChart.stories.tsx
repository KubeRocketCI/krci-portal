import type { Meta, StoryObj } from "@storybook/react-vite";
import { CHART_STATUS_COLOR } from "@/k8s/constants/colors";
import { DonutChart } from "./index";

const meta = {
  title: "Core/Charts/DonutChart",
  component: DonutChart,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof DonutChart>;
export default meta;
type Story = StoryObj<typeof meta>;

const allSegments = [
  { name: "Ok", value: 12, color: CHART_STATUS_COLOR.SUCCESS },
  { name: "In Progress", value: 4, color: CHART_STATUS_COLOR.IN_PROGRESS },
  { name: "Failed", value: 3, color: CHART_STATUS_COLOR.ERROR },
  { name: "Cancelled", value: 2, color: CHART_STATUS_COLOR.CANCELLED },
  { name: "Unknown", value: 1, color: CHART_STATUS_COLOR.UNKNOWN },
];

export const AllSegments: Story = {
  args: { data: allSegments, centerValue: 22, centerLabel: "runs" },
};

export const SuccessOnly: Story = {
  args: { data: [allSegments[0]], centerValue: 12, centerLabel: "runs" },
};

export const Empty: Story = {
  args: { data: [], centerValue: 0, centerLabel: "runs" },
};

export const TileSize: Story = {
  args: { data: allSegments, size: 56, thickness: 7, centerValue: 22, centerValueClassName: "text-sm" },
};
