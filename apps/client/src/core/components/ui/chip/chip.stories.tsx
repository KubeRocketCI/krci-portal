import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { Chip } from "./index";

const meta = {
  title: "Core/UI/Chip",
  component: Chip,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Chip",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondary",
  },
};

export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: "Destructive",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Outline",
  },
};

export const WithDelete: Story = {
  args: {
    children: "Deletable",
    onDelete: fn(),
  },
};

export const Small: Story = {
  args: {
    size: "small",
    children: "Small",
  },
};
