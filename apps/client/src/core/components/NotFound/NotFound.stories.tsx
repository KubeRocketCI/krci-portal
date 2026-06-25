import type { Meta, StoryObj } from "@storybook/react-vite";
import { withAppProviders } from "@sb/index";
import NotFound from "./index";

const meta = {
  title: "Core/Components/NotFound",
  component: NotFound,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [withAppProviders()],
} satisfies Meta<typeof NotFound>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
