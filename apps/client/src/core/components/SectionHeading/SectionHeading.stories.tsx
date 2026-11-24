import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { SectionHeading } from ".";

const meta = {
  title: "Core/SectionHeading",
  component: SectionHeading,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof SectionHeading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: "Capacity" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole("heading", { level: 2, name: "Capacity" })).toBeVisible();
    await expect(canvas.queryByRole("button")).toBeNull();
  },
};

export const WithHint: Story = {
  args: { children: "Capacity", hint: "Room, allocation and capacity of each worker pool." },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await expect(canvas.getByRole("heading", { level: 2, name: "Capacity" })).toBeVisible();
    const button = canvas.getByRole("button", { name: "About Capacity" });

    await userEvent.tab();
    await expect(button).toHaveFocus();
    await expect(await body.findByRole("tooltip")).toHaveTextContent(
      "Room, allocation and capacity of each worker pool."
    );
  },
};
