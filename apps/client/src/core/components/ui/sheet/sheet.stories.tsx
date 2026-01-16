import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sheet, SheetTrigger, SheetContent } from "./index";
import { Button } from "../button";

const meta = {
  title: "Core/UI/Sheet",
  component: Sheet,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open Sheet</Button>
      </SheetTrigger>
      <SheetContent>
        <div className="p-4">
          <h3 className="text-lg font-semibold">Sheet Content</h3>
          <p className="mt-2">This is the sheet content</p>
        </div>
      </SheetContent>
    </Sheet>
  ),
};

export const FromLeft: Story = {
  args: {},
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open From Left</Button>
      </SheetTrigger>
      <SheetContent side="left">
        <div className="p-4">
          <h3 className="text-lg font-semibold">Left Sheet</h3>
          <p className="mt-2">This sheet appears from the left</p>
        </div>
      </SheetContent>
    </Sheet>
  ),
};
