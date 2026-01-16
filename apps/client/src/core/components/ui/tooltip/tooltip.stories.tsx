import type { Meta, StoryObj } from "@storybook/react-vite";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Button } from "../button";

const meta = {
  title: "Core/UI/Tooltip",
  component: TooltipPrimitive.Root,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof TooltipPrimitive.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  render: () => (
    <TooltipPrimitive.Provider>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          <Button variant="outline">Hover me</Button>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            className="bg-primary text-primary-foreground z-50 overflow-hidden rounded-md px-3 py-1.5 text-xs"
            sideOffset={5}
          >
            This is a tooltip
            <TooltipPrimitive.Arrow className="fill-primary" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  ),
};
