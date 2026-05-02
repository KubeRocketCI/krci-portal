import type { Meta, StoryObj } from "@storybook/react-vite";
import { Toolbar } from "./index";

const meta = {
  title: "CDPipelines/StageDetails/Monitoring/Toolbar",
  component: Toolbar,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  args: {
    range: "1h",
    onRangeChange: () => {},
    autoRefresh: true,
    onAutoRefreshChange: () => {},
    lastUpdatedAt: Math.floor(Date.now() / 1000),
    isStale: false,
  },
} satisfies Meta<typeof Toolbar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AutoRefreshOff: Story = {
  args: { autoRefresh: false },
};

export const Stale: Story = {
  args: { isStale: true },
};

export const NeverFetched: Story = {
  args: { lastUpdatedAt: undefined },
};
