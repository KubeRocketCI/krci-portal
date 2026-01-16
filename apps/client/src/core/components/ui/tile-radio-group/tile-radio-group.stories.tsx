import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { TileRadioGroup } from "./index";

const meta = {
  title: "Core/UI/TileRadioGroup",
  component: TileRadioGroup,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof TileRadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { value: "", onValueChange: () => {}, options: [] },
  render: () => {
    const [value, setValue] = useState<string>("");
    return (
      <TileRadioGroup
        value={value}
        onValueChange={setValue}
        options={[
          { value: "option1", label: "Option 1", description: "Description 1", icon: <span>📦</span> },
          { value: "option2", label: "Option 2", description: "Description 2", icon: <span>🎨</span> },
          { value: "option3", label: "Option 3", description: "Description 3", icon: <span>⚙️</span> },
        ]}
      />
    );
  },
};
