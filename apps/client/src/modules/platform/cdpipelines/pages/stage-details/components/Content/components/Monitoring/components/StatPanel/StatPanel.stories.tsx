import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatPanel } from "./index";

const meta = {
  title: "CDPipelines/StageDetails/Monitoring/StatPanel",
  component: StatPanel,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof StatPanel>;
export default meta;
type Story = StoryObj<typeof meta>;

export const SmallValue: Story = {
  args: { title: "CPU Utilisation (from requests)", value: 9.18, isLoading: false, error: null },
};

export const MidValue: Story = {
  args: { title: "Memory Utilisation (from requests)", value: 52.9, isLoading: false, error: null },
};

export const Saturated: Story = {
  args: { title: "CPU Utilisation (from limits)", value: 137, isLoading: false, error: null },
};

export const NoData: Story = {
  args: { title: "Memory Utilisation (from limits)", value: null, isLoading: false, error: null },
};

export const Loading: Story = {
  args: { title: "CPU Utilisation (from requests)", value: null, isLoading: true, error: null },
};

export const Errored: Story = {
  args: {
    title: "CPU Utilisation (from limits)",
    value: null,
    isLoading: false,
    error: new Error("Cannot reach Prometheus."),
  },
};
