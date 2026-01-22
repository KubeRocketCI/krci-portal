import type { Meta, StoryObj } from "@storybook/react-vite";
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
};
