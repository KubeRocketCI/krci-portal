import type { Meta, StoryObj } from "@storybook/react-vite";
import TitleStatus from "./index";

const meta = {
  title: "Core/UI/TitleStatus",
  component: TitleStatus,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof TitleStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: {
    title: "Deployment Successful",
    status: "success",
  },
};

export const Error: Story = {
  args: {
    title: "Deployment Failed",
    status: "error",
  },
};

export const Warning: Story = {
  args: {
    title: "Warning: Low Resources",
    status: "warning",
  },
};

export const Info: Story = {
  args: {
    title: "System Update Available",
    status: "info",
  },
};
