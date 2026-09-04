import type { Meta, StoryObj } from "@storybook/react-vite";
import { Box } from "lucide-react";
import { TextWithTooltip } from "./index";

/**
 * `.tsx` is excluded from Vitest coverage; these stories are the visual check for the clamp
 * and the tooltip. The tooltip needs no app providers beyond its own.
 *
 * Drag the wrapper's edge to shrink it: the ellipsis and tooltip appear once the text is
 * clipped, and both disappear once the text fits again.
 */

const meta = {
  title: "Core/Components/TextWithTooltip",
  component: TextWithTooltip,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-[280px] resize-x overflow-auto border border-dashed p-2">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TextWithTooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    text: "customer-portal-frontend-build-main-2026-09-04-run-0042",
  },
};

export const TwoLines: Story = {
  args: {
    text: "A longer description that wraps onto two lines before it clips with an ellipsis and shows the full text in a tooltip.",
    maxLineAmount: 2,
  },
};

export const Fallback: Story = {
  args: {
    text: null,
  },
};

export const BesideIcon: Story = {
  render: (args) => (
    <div className="flex min-w-0 items-center gap-2">
      <Box className="text-muted-foreground/70 shrink-0" size={16} />
      <TextWithTooltip {...args} />
    </div>
  ),
  args: {
    text: "customer-portal-frontend-build-npm-nextjs-edp",
  },
};

export const InsideLink: Story = {
  render: (args) => (
    <div className="flex min-w-0 items-center gap-2">
      <a href="#" className="text-secondary-dark hover:text-primary min-w-0 hover:underline">
        <TextWithTooltip {...args} />
      </a>
    </div>
  ),
  args: {
    text: "customer-portal-frontend-build-main-2026-09-04-run-0042",
  },
};
