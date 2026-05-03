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

const sampleData = [
  { app: "frontend", series: sampleSeries(0, 0.4) },
  { app: "api", series: sampleSeries(1, 0.2) },
  { app: "worker", series: sampleSeries(2, 0.3) },
];

export const WithDataSingleApp: Story = {
  args: {
    title: "CPU usage",
    unit: "cores",
    data: [{ app: "frontend", series: sampleSeries(0, 0.5) }],
    isLoading: false,
    error: null,
  },
};

export const WithDataMultiApp: Story = {
  args: {
    title: "CPU usage",
    unit: "cores",
    data: sampleData,
    isLoading: false,
    error: null,
  },
};

export const BytesPerSecond: Story = {
  args: {
    title: "Network receive",
    unit: "bytes/s",
    data: [
      { app: "frontend", series: sampleSeries(0, 1024 * 1024 * 1.5) },
      { app: "worker", series: sampleSeries(1, 1024 * 512) },
    ],
    isLoading: false,
    error: null,
  },
};

export const SelectedAppsFilter: Story = {
  args: {
    title: "CPU usage (only frontend)",
    unit: "cores",
    data: sampleData,
    isLoading: false,
    error: null,
    selectedApps: new Set(["frontend"]),
  },
};

export const Loading: Story = {
  args: { title: "CPU usage", unit: "cores", data: [], isLoading: true, error: null },
};

export const Empty: Story = {
  args: { title: "CPU usage", unit: "cores", data: [], isLoading: false, error: null },
};

export const ErrorState: Story = {
  args: {
    title: "CPU usage",
    unit: "cores",
    data: [],
    isLoading: false,
    error: new Error("Cannot reach Prometheus."),
  },
};
