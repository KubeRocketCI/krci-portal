import type { Meta, StoryObj } from "@storybook/react-vite";
import { Progress } from "./index";

const meta = {
  title: "Core/UI/Progress",
  component: Progress,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: 50,
  },
};

export const Empty: Story = {
  args: {
    value: 0,
  },
};

export const Full: Story = {
  args: {
    value: 100,
  },
};

export const ThreeQuarters: Story = {
  args: {
    value: 75,
  },
};
