import type { Meta, StoryObj } from "@storybook/react-vite";
import { withAppProviders } from "@sb/index";
import Forbidden from "./index";

const meta = {
  title: "Core/Components/Forbidden",
  component: Forbidden,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [withAppProviders()],
} satisfies Meta<typeof Forbidden>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
