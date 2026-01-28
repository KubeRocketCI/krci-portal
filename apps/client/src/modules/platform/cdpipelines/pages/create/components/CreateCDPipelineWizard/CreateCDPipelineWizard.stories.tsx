import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { CreateCDPipelineWizard } from "./index";
import { withAppProviders } from "@sb/index";

const meta = {
  title: "Platform/CDPipelines/Wizards/CreateCDPipelineWizard",
  component: CreateCDPipelineWizard,
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
} satisfies Meta<typeof CreateCDPipelineWizard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <CreateCDPipelineWizard />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/pipeline configuration/i)).toBeInTheDocument();
    await expect(canvas.getAllByText(/applications/i).length).toBeGreaterThan(0);
    await expect(canvas.getAllByText(/review/i).length).toBeGreaterThan(0);
    await expect(canvas.getByRole("button", { name: /continue/i })).toBeInTheDocument();
    await expect(canvas.getByRole("link", { name: /cancel/i })).toBeInTheDocument();
  },
};
