import type { Meta, StoryObj } from "@storybook/react-vite";
import { PodPhasePanel } from "./index";

const meta = {
  title: "CDPipelines/StageDetails/Monitoring/PodPhasePanel",
  component: PodPhasePanel,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
} satisfies Meta<typeof PodPhasePanel>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Mixed: Story = {
  args: {
    data: [
      {
        app: "frontend",
        pods: [
          { name: "frontend-7c9d4-ab12", phase: "Running" },
          { name: "frontend-7c9d4-cd34", phase: "Pending" },
        ],
      },
      { app: "worker", pods: [{ name: "worker-1", phase: "Failed" }] },
    ],
  },
};

export const AllRunning: Story = {
  args: {
    data: [
      { app: "frontend", pods: [{ name: "frontend-1", phase: "Running" }] },
      { app: "worker", pods: [{ name: "worker-1", phase: "Running" }] },
    ],
  },
};

export const EmptyState: Story = {
  args: {
    data: [
      { app: "frontend", pods: [] },
      { app: "worker", pods: [] },
    ],
  },
};
