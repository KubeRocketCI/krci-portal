import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, screen, userEvent, waitFor, within } from "storybook/test";
import { SecurityOtherLines } from "./index";

const meta = {
  title: "CDPipelines/Stage/Security Other Lines",
  component: SecurityOtherLines,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="w-[720px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SecurityOtherLines>;

export default meta;
type Story = StoryObj<typeof meta>;

const link = "https://defectdojo.example.com/engagement/49";

const edgeNginx = {
  codebase: "edge-nginx",
  workloads: ["deployment/nginx"],
  versions: ["main-20261110-194848"],
  counts: { critical: 0, high: 0, medium: 2, low: 1, unassigned: 0 },
  link,
};

const paymentsSidecar = {
  codebase: "payments-sidecar",
  workloads: ["deployment/payments"],
  versions: ["main-20261112-101530"],
  counts: { critical: 1, high: 3, medium: 0, low: 0, unassigned: 5 },
  link,
};

const workloads = {
  workloads: ["deployment/web", "statefulset/redis"],
  counts: { critical: 1, high: 1, medium: 2, low: 0, unassigned: 0 },
  link,
};

/** The previous tooltip can still be closing, so any open tooltip may carry the text. */
const expectOpenTooltip = (text: RegExp) =>
  waitFor(() =>
    expect(
      screen
        .getAllByRole("tooltip")
        .map((tooltip) => tooltip.textContent)
        .join(" ")
    ).toMatch(text)
  );

export const CodebasesAndWorkloads: Story = {
  args: { codebases: { entries: [edgeNginx, paymentsSidecar], link }, workloads },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("link", { name: "Open runtime findings in DefectDojo" })).toHaveLength(2);

    await userEvent.hover(canvas.getByText("Other codebases"));
    await expectOpenTooltip(/not applications of this deployment/);

    await userEvent.hover(canvas.getByText("Other workloads"));
    await expectOpenTooltip(/belong to no codebase/);
  },
};

export const WorkloadsOnly: Story = {
  args: { workloads },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByText("Other codebases")).not.toBeInTheDocument();
  },
};

export const CodebasesOnly: Story = {
  args: { codebases: { entries: [edgeNginx], link } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByText("Other workloads")).not.toBeInTheDocument();
  },
};
