import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "./index";
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
        <SheetHeader>
          <SheetTitle>Sheet Content</SheetTitle>
          <SheetDescription>This is the sheet content</SheetDescription>
        </SheetHeader>
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
        <SheetHeader>
          <SheetTitle>Left Sheet</SheetTitle>
          <SheetDescription>This sheet appears from the left</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
};
