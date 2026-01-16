import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label } from "./index";

const meta = {
  title: "Core/UI/Label",
  component: Label,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Label",
  },
};

export const WithHtmlFor: Story = {
  args: {},
  render: () => (
    <div className="flex flex-col gap-2">
      <Label htmlFor="email">Email Address</Label>
      <input id="email" type="email" className="rounded border px-2 py-1" />
    </div>
  ),
};
