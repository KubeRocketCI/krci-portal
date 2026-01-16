import type { Meta, StoryObj } from "@storybook/react-vite";
import { LoadingWrapper } from "./index";

const meta = {
  title: "Core/Components/LoadingWrapper",
  component: LoadingWrapper,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof LoadingWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

const SampleContent = () => (
  <div className="bg-card rounded-md border p-6">
    <h3 className="text-lg font-semibold">Content Loaded!</h3>
    <p className="text-muted-foreground mt-2">This is the actual content that displays when loading is complete.</p>
  </div>
);

export const LoadingSpinner: Story = {
  args: {
    isLoading: true,
    variant: "spinner",
    children: <SampleContent />,
  },
};

export const LoadingSpinnerSmall: Story = {
  args: {
    isLoading: true,
    variant: "spinner",
    iconProps: { size: 20 },
    children: <SampleContent />,
  },
};

export const LoadingSpinnerLarge: Story = {
  args: {
    isLoading: true,
    variant: "spinner",
    iconProps: { size: 48 },
    children: <SampleContent />,
  },
};

export const LoadingProgress: Story = {
  args: {
    isLoading: true,
    variant: "progress",
    children: <SampleContent />,
  },
};

export const LoadingComplete: Story = {
  args: {
    isLoading: false,
    variant: "spinner",
    children: <SampleContent />,
  },
};

export const InteractiveSwitching: Story = {
  args: {
    isLoading: true,
    variant: "spinner",
    children: <SampleContent />,
  },
  render: () => {
    const [isLoading, setIsLoading] = React.useState(true);
    const [variant, setVariant] = React.useState<"spinner" | "progress">("spinner");

    return (
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setIsLoading(!isLoading)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2"
          >
            {isLoading ? "Stop Loading" : "Start Loading"}
          </button>
          <button
            onClick={() => setVariant(variant === "spinner" ? "progress" : "spinner")}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-md px-4 py-2"
          >
            Switch to {variant === "spinner" ? "Progress" : "Spinner"}
          </button>
        </div>
        <LoadingWrapper isLoading={isLoading} variant={variant}>
          <SampleContent />
        </LoadingWrapper>
      </div>
    );
  },
};

// Import React for the interactive story
import React from "react";
