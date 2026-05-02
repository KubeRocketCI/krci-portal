import type { Meta, StoryObj } from "@storybook/react-vite";
import { MetricChart } from "./index";

const meta = {
  title: "CDPipelines/StageDetails/Monitoring/MetricChart",
  component: MetricChart,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof MetricChart>;
export default meta;
type Story = StoryObj<typeof meta>;

const now = Math.floor(Date.now() / 1000);
const sampleSeries = (offset: number, scale: number) =>
  Array.from({ length: 30 }, (_, i) => ({
    t: now - (29 - i) * 60,
    v: scale * (1 + Math.sin(i / 4 + offset) * 0.4),
  }));

export const WithDataSingleApp: Story = {
  args: {
    title: "CPU usage",
    unit: "cores",
    isLoading: false,
    error: null,
    data: [{ app: "krci-portal", series: sampleSeries(0, 0.5) }],
  },
};

export const WithDataMultipleApps: Story = {
  args: {
    title: "CPU usage",
    unit: "cores",
    isLoading: false,
    error: null,
    data: [
      { app: "frontend", series: sampleSeries(0, 0.4) },
      { app: "api", series: sampleSeries(1, 0.7) },
      { app: "worker", series: sampleSeries(2, 0.3) },
    ],
  },
};

export const Loading: Story = {
  args: { title: "CPU usage", unit: "cores", isLoading: true, error: null, data: [] },
};

export const Empty: Story = {
  args: { title: "CPU usage", unit: "cores", isLoading: false, error: null, data: [] },
};

export const ErrorState: Story = {
  args: {
    title: "CPU usage",
    unit: "cores",
    isLoading: false,
    error: new globalThis.Error("Metrics query timed out. Try a shorter range."),
    data: [],
  },
};
