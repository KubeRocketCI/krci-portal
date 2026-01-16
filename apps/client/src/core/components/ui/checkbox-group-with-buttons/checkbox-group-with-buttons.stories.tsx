import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { CheckboxGroupWithButtons } from "./index";

const meta = {
  title: "Core/UI/CheckboxGroupWithButtons",
  component: CheckboxGroupWithButtons,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof CheckboxGroupWithButtons>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { value: [], onValueChange: () => {}, options: [] },
  render: () => {
    const [value, setValue] = useState<string[]>([]);
    return (
      <CheckboxGroupWithButtons
        value={value}
        onValueChange={setValue}
        options={[
          { value: "option1", label: "Option 1" },
          { value: "option2", label: "Option 2" },
          { value: "option3", label: "Option 3" },
        ]}
      />
    );
  },
};
