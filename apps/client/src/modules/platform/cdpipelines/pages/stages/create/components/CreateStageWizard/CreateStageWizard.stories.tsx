import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { CreateStageWizard } from "./index";
import { withAppProviders } from "@sb/index";

const meta = {
  title: "Platform/CDPipelines/Wizards/CreateStageWizard",
  component: CreateStageWizard,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [
    withAppProviders(),
    (Story) => (
      <div className="p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CreateStageWizard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <CreateStageWizard />,
  play: async ({ canvas }) => {
    await expect(canvas.getAllByText(/basic configuration/i).length).toBeGreaterThan(0);
    await expect(canvas.getAllByText(/quality gates/i).length).toBeGreaterThan(0);
    await expect(canvas.getAllByText(/review/i).length).toBeGreaterThan(0);
    await expect(canvas.getByRole("button", { name: /continue/i })).toBeInTheDocument();
    await expect(canvas.getByRole("link", { name: /cancel/i })).toBeInTheDocument();
  },
};
