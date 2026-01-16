import type { Meta, StoryObj } from "@storybook/react-vite";
import { Alert } from "./index";

const meta = {
  title: "Core/UI/Alert",
  component: Alert,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Alert Title",
    children: "This is an alert message",
  },
};

export const Destructive: Story = {
  args: {
    variant: "destructive",
    title: "Error",
    children: "Something went wrong",
  },
};

export const WithoutTitle: Story = {
  args: {
    children: "Alert without title",
  },
};
