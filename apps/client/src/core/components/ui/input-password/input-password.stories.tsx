import type { Meta, StoryObj } from "@storybook/react-vite";
import { InputPassword } from "./index";

const meta = {
  title: "Core/UI/InputPassword",
  component: InputPassword,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof InputPassword>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Password",
  },
};

export const WithHelperText: Story = {
  args: {
    label: "Password",
    helperText: "Must be at least 8 characters",
  },
};

export const WithError: Story = {
  args: {
    label: "Password",
    error: "Password is required",
  },
};

export const Required: Story = {
  args: {
    label: "Password",
    required: true,
  },
};

export const WithoutToggle: Story = {
  args: {
    label: "Password",
    showToggle: false,
  },
};
