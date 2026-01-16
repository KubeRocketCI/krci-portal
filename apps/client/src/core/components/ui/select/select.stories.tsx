import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./index";

const meta = {
  title: "Core/UI/Select",
  component: Select,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<string>("");
    return (
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
          <SelectItem value="option3">Option 3</SelectItem>
        </SelectContent>
      </Select>
    );
  },
};

export const WithIcons: Story = {
  render: () => {
    const [value, setValue] = useState<string>("");
    return (
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple" icon="🍎">
            Apple
          </SelectItem>
          <SelectItem value="banana" icon="🍌">
            Banana
          </SelectItem>
          <SelectItem value="orange" icon="🍊">
            Orange
          </SelectItem>
        </SelectContent>
      </Select>
    );
  },
};

export const Disabled: Story = {
  args: {},
  render: () => (
    <Select disabled>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select an option" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Option 1</SelectItem>
      </SelectContent>
    </Select>
  ),
};
