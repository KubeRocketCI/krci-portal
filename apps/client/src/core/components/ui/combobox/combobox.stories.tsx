import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Combobox } from "./index";

const meta = {
  title: "Core/UI/Combobox",
  component: Combobox,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

const frameworks = [
  { value: "next", label: "Next.js" },
  { value: "react", label: "React" },
  { value: "vue", label: "Vue" },
  { value: "svelte", label: "Svelte" },
];

export const Default: Story = {
  args: { value: "", onValueChange: () => {}, options: [], placeholder: "Select framework..." },
  render: () => {
    const [value, setValue] = useState<string>("");
    return (
      <Combobox
        value={value}
        //@ts-expect-error TEMPORARY
        onValueChange={setValue}
        options={frameworks}
        placeholder="Select framework..."
        emptyText="No framework found."
      />
    );
  },
};
