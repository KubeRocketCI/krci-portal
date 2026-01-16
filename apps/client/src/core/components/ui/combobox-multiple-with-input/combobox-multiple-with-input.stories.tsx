import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ComboboxMultipleWithInput } from "./index";

const meta = {
  title: "Core/UI/ComboboxMultipleWithInput",
  component: ComboboxMultipleWithInput,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ComboboxMultipleWithInput>;

export default meta;
type Story = StoryObj<typeof meta>;

const options = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
];

export const Default: Story = {
  args: { value: [], onValueChange: () => {}, options: [], placeholder: "Select languages..." },
  render: () => {
    const [value, setValue] = useState<string[]>([]);
    return (
      <ComboboxMultipleWithInput
        value={value}
        onValueChange={setValue}
        options={options}
        placeholder="Select languages..."
      />
    );
  },
};
