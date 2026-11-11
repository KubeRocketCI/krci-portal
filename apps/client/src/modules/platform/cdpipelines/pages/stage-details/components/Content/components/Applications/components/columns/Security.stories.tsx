import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { SecurityColumn } from "./Security";

const meta = {
  title: "CDPipelines/Stage/Security Column",
  component: SecurityColumn,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof SecurityColumn>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithFindings: Story = {
  args: {
    application: {
      codebase: "test-go-app",
      workloads: ["deployment/test-go-app"],
      versions: ["main-20261110-194848"],
      counts: { critical: 0, high: 2, medium: 5, low: 0, unassigned: 156 },
      link: "https://defectdojo.example.com/engagement/48",
    },
    isLoading: false,
    error: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTitle("High: 2")).toBeVisible();
    await expect(canvas.getByTitle("Unassigned: 156")).toBeVisible();
    await expect(canvas.getByRole("link", { name: "Open runtime findings in DefectDojo" })).toHaveAttribute(
      "href",
      "https://defectdojo.example.com/engagement/48"
    );
  },
};

export const NotScanned: Story = {
  args: { application: undefined, isLoading: false, error: null },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("Not scanned")).toBeVisible();
  },
};

export const Loading: Story = {
  args: { application: undefined, isLoading: true, error: null },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("status", { name: "Loading security findings" })).toBeVisible();
  },
};

export const Unavailable: Story = {
  args: { application: undefined, isLoading: false, error: new Error("DefectDojo is not configured") },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("Unavailable")).toHaveAttribute(
      "title",
      "DefectDojo is not configured"
    );
  },
};
