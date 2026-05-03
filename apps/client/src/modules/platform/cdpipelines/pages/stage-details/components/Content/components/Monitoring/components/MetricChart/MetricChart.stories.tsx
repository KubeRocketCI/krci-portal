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
const samplePoints = (offset: number, scale: number) =>
  Array.from({ length: 30 }, (_, i) => ({
    t: now - (29 - i) * 60,
    v: scale * (1 + Math.sin(i / 4 + offset) * 0.4),
  }));

const sampleApp = (app: string, pods: Array<{ pod: string; offset: number; scale: number }>) => ({
  app,
  pods: pods.map(({ pod, offset, scale }) => ({ pod, series: samplePoints(offset, scale) })),
});

const singlePodApp = sampleApp("frontend", [{ pod: "frontend-5b799844b-7qr6x", offset: 0, scale: 0.5 }]);

const multiPodSingleApp = sampleApp("frontend", [
  { pod: "frontend-5b799844b-7qr6x", offset: 0, scale: 0.5 },
  { pod: "frontend-75b7875569-nf9cp", offset: 1.2, scale: 0.3 },
]);

const multiAppData = [
  sampleApp("frontend", [{ pod: "frontend-1", offset: 0, scale: 0.4 }]),
  sampleApp("api", [{ pod: "api-1", offset: 1, scale: 0.2 }]),
  sampleApp("worker", [{ pod: "worker-1", offset: 2, scale: 0.3 }]),
];

export const SinglePod: Story = {
  args: {
    title: "CPU usage",
    unit: "cores",
    data: [singlePodApp],
    isLoading: false,
    error: null,
  },
};

export const MultiPodSingleApp: Story = {
  args: {
    title: "CPU usage (rolling deployment)",
    unit: "cores",
    data: [multiPodSingleApp],
    isLoading: false,
    error: null,
  },
};

export const MultiApp: Story = {
  args: {
    title: "CPU usage",
    unit: "cores",
    data: multiAppData,
    isLoading: false,
    error: null,
  },
};

export const BytesPerSecond: Story = {
  args: {
    title: "Network receive",
    unit: "bytes/s",
    data: [
      sampleApp("frontend", [{ pod: "frontend-1", offset: 0, scale: 1024 * 1024 * 1.5 }]),
      sampleApp("worker", [{ pod: "worker-1", offset: 1, scale: 1024 * 512 }]),
    ],
    isLoading: false,
    error: null,
  },
};

export const SelectedAppsFilter: Story = {
  args: {
    title: "CPU usage (only frontend)",
    unit: "cores",
    data: multiAppData,
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
