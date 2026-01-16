import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ComboboxWithInput } from "./index";

const meta = {
  title: "Core/UI/ComboboxWithInput",
  component: ComboboxWithInput,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ComboboxWithInput>;

export default meta;
type Story = StoryObj<typeof meta>;

const options = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "orange", label: "Orange" },
];

export const Default: Story = {
  args: { value: "", onValueChange: () => {}, options: [], placeholder: "Search..." },
  render: () => {
    const [value, setValue] = useState<string>("");
    return <ComboboxWithInput value={value} onValueChange={setValue} options={options} placeholder="Search..." />;
  },
};
