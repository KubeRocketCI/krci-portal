import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Textarea } from "./index";

const meta = {
  title: "Core/UI/Textarea",
  component: Textarea,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "Enter text...",
  },
};

export const WithValue: Story = {
  render: () => {
    const [value, setValue] = useState("Sample text content");
    return <Textarea value={value} onChange={(e) => setValue(e.target.value)} />;
  },
};

export const WithRows: Story = {
  args: {
    placeholder: "Fixed height",
    rows: 4,
  },
};

export const Disabled: Story = {
  args: {
    placeholder: "Disabled textarea",
    disabled: true,
  },
};

export const Invalid: Story = {
  args: {
    placeholder: "Invalid textarea",
    invalid: true,
  },
};
