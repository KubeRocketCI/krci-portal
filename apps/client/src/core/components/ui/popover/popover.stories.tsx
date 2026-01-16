import type { Meta, StoryObj } from "@storybook/react-vite";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Button } from "../button";

const meta = {
  title: "Core/UI/Popover",
  component: PopoverPrimitive.Root,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof PopoverPrimitive.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  render: () => (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>
        <Button variant="outline">Open popover</Button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content className="z-50 w-72 rounded-md border bg-white p-4 shadow-md" sideOffset={5}>
          <div className="space-y-2">
            <h4 className="font-medium">Popover Title</h4>
            <p className="text-sm text-gray-600">This is the popover content</p>
          </div>
          <PopoverPrimitive.Arrow className="fill-white" />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  ),
};
