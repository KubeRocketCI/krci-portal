import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "./index";

const meta = {
  title: "Core/UI/Input",
  component: Input,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "Enter text...",
  },
};

export const WithValue: Story = {
  render: () => {
    const [value, setValue] = useState("Sample text");
    return <Input value={value} onChange={(e) => setValue(e.target.value)} />;
  },
};

export const Disabled: Story = {
  args: {
    placeholder: "Disabled input",
    disabled: true,
  },
};

export const Invalid: Story = {
  args: {
    placeholder: "Invalid input",
    invalid: true,
  },
};

export const Email: Story = {
  args: {
    type: "email",
    placeholder: "email@example.com",
  },
};
