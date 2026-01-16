import type { Meta, StoryObj } from "@storybook/react-vite";
import { InputEditable } from "./index";

const meta = {
  title: "Core/UI/InputEditable",
  component: InputEditable,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof InputEditable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    inputProps: {
      defaultValue: "Click to edit",
    },
  },
};

export const Empty: Story = {
  args: {
    inputProps: {
      placeholder: "Click to enter text",
    },
  },
};
