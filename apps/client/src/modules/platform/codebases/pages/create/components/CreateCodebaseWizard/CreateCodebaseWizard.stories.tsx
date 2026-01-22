import type { Meta, StoryObj } from "@storybook/react-vite";
import { CreateCodebaseWizard } from "./index";
import { withAppProviders } from "@sb/index";

const meta = {
  title: "Platform/Codebases/Wizards/CreateCodebaseWizard",
  component: CreateCodebaseWizard,
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
} satisfies Meta<typeof CreateCodebaseWizard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <CreateCodebaseWizard />,
};
