import type { Meta, StoryObj } from "@storybook/react-vite";
import { TextareaPassword } from "./index";

const meta = {
  title: "Core/UI/TextareaPassword",
  component: TextareaPassword,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof TextareaPassword>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Secret Text",
  },
};

export const WithHelperText: Story = {
  args: {
    label: "API Key",
    helperText: "Keep this secure",
  },
};

export const WithError: Story = {
  args: {
    label: "Secret",
    error: "This field is required",
  },
};

export const WithoutToggle: Story = {
  args: {
    label: "Password",
    showToggle: false,
  },
};
