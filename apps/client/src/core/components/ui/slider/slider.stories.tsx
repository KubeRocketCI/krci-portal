import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Slider } from "./index";

const meta = {
  title: "Core/UI/Slider",
  component: Slider,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [v, setV] = useState([3]);
    return (
      <div className="w-72">
        <Slider value={v} onValueChange={setV} min={0} max={20} step={1} />
        <p className="mt-2 text-sm">value: {v[0]}</p>
      </div>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="w-72">
      {/* No-op onValueChange so the controlled-mode contract is explicit (Radix
          silently ignores keyboard interaction on a controlled Slider without one). */}
      <Slider value={[5]} onValueChange={() => {}} min={0} max={10} disabled />
    </div>
  ),
};

export const Range: Story = {
  render: () => {
    const [v, setV] = useState([2, 8]);
    return (
      <div className="w-72">
        <Slider value={v} onValueChange={setV} min={0} max={10} step={1} />
        <p className="mt-2 text-sm">
          range: {v[0]} – {v[1]}
        </p>
      </div>
    );
  },
};
