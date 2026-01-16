import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox } from "./index";

const meta = {
  title: "Core/UI/Checkbox",
  component: Checkbox,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Checked: Story = {
  render: () => {
    const [checked, setChecked] = useState(true);
    //@ts-expect-error TEMPORARY
    return <Checkbox checked={checked} onCheckedChange={setChecked} />;
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Invalid: Story = {
  args: {
    invalid: true,
  },
};

export const WithLabel: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return (
      <div className="flex items-center gap-2">
        {/* @ts-expect-error TEMPORARY */}
        <Checkbox id="terms" checked={checked} onCheckedChange={setChecked} />
        <label htmlFor="terms" className="text-sm">
          Accept terms and conditions
        </label>
      </div>
    );
  },
};
