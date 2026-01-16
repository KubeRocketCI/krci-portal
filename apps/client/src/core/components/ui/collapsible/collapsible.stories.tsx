import type { Meta, StoryObj } from "@storybook/react-vite";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";

const meta = {
  title: "Core/UI/Collapsible",
  component: CollapsiblePrimitive.Root,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof CollapsiblePrimitive.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  render: () => (
    <CollapsiblePrimitive.Root className="w-[350px]">
      <CollapsiblePrimitive.Trigger asChild>
        <button className="flex w-full items-center justify-between rounded-md border p-4">
          <span>Click to toggle</span>
          <span>▼</span>
        </button>
      </CollapsiblePrimitive.Trigger>
      <CollapsiblePrimitive.Content className="mt-2 rounded-md border p-4">
        This is the collapsible content that can be toggled.
      </CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
  ),
};
