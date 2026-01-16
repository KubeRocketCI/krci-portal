import type { Meta, StoryObj } from "@storybook/react-vite";
import { LoadingProgressBar } from "./index";

const meta = {
  title: "Core/UI/LoadingProgressBar",
  component: LoadingProgressBar,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof LoadingProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
