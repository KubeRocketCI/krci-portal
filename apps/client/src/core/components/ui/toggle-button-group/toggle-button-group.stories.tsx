import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { ToggleButtonGroup, ToggleButton } from "./index";

const meta = {
  title: "Core/UI/ToggleButtonGroup",
  component: ToggleButtonGroup,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ToggleButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: "left",
    onChange: () => {},
    children: [],
  },
  render: () => {
    const [value, setValue] = useState<"left" | "center" | "right" | null>("left");

    return (
      <ToggleButtonGroup value={value!} onChange={(_, newValue) => setValue(newValue)}>
        <ToggleButton value="left">Left</ToggleButton>
        <ToggleButton value="center">Center</ToggleButton>
        <ToggleButton value="right">Right</ToggleButton>
      </ToggleButtonGroup>
    );
  },
};

export const Small: Story = {
  args: {
    value: "md",
    onChange: () => {},
    size: "sm",
    children: [],
  },
  render: () => {
    const [value, setValue] = useState<"sm" | "md" | "lg" | null>("md");

    return (
      <ToggleButtonGroup value={value!} onChange={(_, newValue) => setValue(newValue)} size="sm">
        <ToggleButton value="sm">Small</ToggleButton>
        <ToggleButton value="md">Medium</ToggleButton>
        <ToggleButton value="lg">Large</ToggleButton>
      </ToggleButtonGroup>
    );
  },
};
