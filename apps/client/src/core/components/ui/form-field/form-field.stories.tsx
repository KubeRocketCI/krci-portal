import type { Meta, StoryObj } from "@storybook/react-vite";
import { FormField } from "./index";
import { Input } from "../input";

const meta = {
  title: "Core/UI/FormField",
  component: FormField,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Email",
    children: null,
  },
  render: (args) => (
    <FormField {...args}>
      <Input placeholder="Enter email" />
    </FormField>
  ),
};

export const WithHelperText: Story = {
  args: {
    label: "Password",
    helperText: "Must be at least 8 characters",
    children: null,
  },
  render: (args) => (
    <FormField {...args}>
      <Input type="password" />
    </FormField>
  ),
};

export const WithError: Story = {
  args: {
    label: "Username",
    error: "Username is required",
    children: null,
  },
  render: (args) => (
    <FormField {...args}>
      <Input />
    </FormField>
  ),
};

export const Required: Story = {
  args: {
    label: "Email",
    required: true,
    children: null,
  },
  render: (args) => (
    <FormField {...args}>
      <Input type="email" />
    </FormField>
  ),
};

export const WithTooltip: Story = {
  args: {
    label: "API Key",
    tooltipText: "You can find this in your account settings",
    children: null,
  },
  render: (args) => (
    <FormField {...args}>
      <Input />
    </FormField>
  ),
};
