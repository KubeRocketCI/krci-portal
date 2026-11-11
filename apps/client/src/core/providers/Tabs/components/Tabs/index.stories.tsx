import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState, type ReactNode } from "react";
import { expect, fn, waitFor } from "storybook/test";
import { Tabs } from "./index";
import type { Tab } from "./types";

const TAB_LABELS = [
  "Overview",
  "Branches",
  "Dependencies",
  "Code Quality",
  "Pull Requests",
  "Deployments",
  "Environments",
  "Settings",
];

const tabs: Tab[] = TAB_LABELS.map((label) => ({
  id: label.toLowerCase().replace(/\s+/g, "-"),
  label,
  component: <div className="text-sm">{label} content</div>,
}));

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function ReducedMotion({ children }: { children: ReactNode }) {
  const [isPatched, setIsPatched] = useState(false);

  useEffect(() => {
    const original = window.matchMedia;
    window.matchMedia = (query: string) => {
      const result = original.call(window, query);

      return query === REDUCED_MOTION_QUERY ? ({ ...result, matches: true } as MediaQueryList) : result;
    };
    setIsPatched(true);

    return () => {
      window.matchMedia = original;
    };
  }, []);

  return isPatched ? <>{children}</> : null;
}

const getOverlays = (canvasElement: HTMLElement) => {
  const [left, right] = Array.from(canvasElement.querySelectorAll('[aria-hidden="true"]'));

  return { left, right };
};

const meta = {
  title: "Core/Providers/Tabs",
  component: Tabs,
  tags: ["autodocs"],
  args: {
    tabs,
    activeTabIdx: 0,
    handleChangeTab: fn(),
  },
  decorators: [
    (Story, { parameters }) => (
      <div style={{ width: parameters.containerWidth ?? "100%" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Wide: Story = {
  parameters: { containerWidth: 1200 },
  play: async ({ canvasElement }) => {
    const { left, right } = getOverlays(canvasElement);

    await waitFor(() => {
      expect(left).toHaveClass("opacity-0");
      expect(right).toHaveClass("opacity-0");
    });
  },
};

export const Narrow: Story = {
  parameters: { containerWidth: 360 },
  play: async ({ canvasElement }) => {
    const { left, right } = getOverlays(canvasElement);

    await waitFor(() => {
      expect(left).toHaveClass("opacity-0");
      expect(right).toHaveClass("opacity-100");
    });
  },
};

export const NarrowLastTabActive: Story = {
  args: { activeTabIdx: TAB_LABELS.length - 1 },
  parameters: { containerWidth: 360 },
  play: async ({ canvasElement }) => {
    const { left, right } = getOverlays(canvasElement);

    await waitFor(
      () => {
        expect(left).toHaveClass("opacity-100");
        expect(right).toHaveClass("opacity-0");
      },
      { timeout: 3000 }
    );
  },
};

export const ReducedMotionPreference: Story = {
  parameters: { containerWidth: 360 },
  decorators: [
    (Story) => (
      <ReducedMotion>
        <Story />
      </ReducedMotion>
    ),
  ],
  play: async ({ canvasElement }) => {
    const { right } = getOverlays(canvasElement);

    await waitFor(() => expect(right).toHaveClass("opacity-100"));
  },
};
