import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState, type ReactNode } from "react";
import { expect, fn, waitFor } from "storybook/test";
import type { Tab } from "@/core/providers/Tabs/components/Tabs/types";
import { TabBar } from "./index";

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
  component: null,
}));

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function ReducedMotion({ children }: { children: ReactNode }) {
  const [isPatched, setIsPatched] = useState(false);

  useEffect(() => {
    const original = window.matchMedia;
    window.matchMedia = (query: string) => {
      const result = original.call(window, query);
      if (query !== REDUCED_MOTION_QUERY) {
        return result;
      }

      return {
        matches: true,
        media: query,
        onchange: null,
        addEventListener: result.addEventListener.bind(result),
        removeEventListener: result.removeEventListener.bind(result),
        addListener: result.addListener.bind(result),
        removeListener: result.removeListener.bind(result),
        dispatchEvent: result.dispatchEvent.bind(result),
      } satisfies MediaQueryList;
    };
    setIsPatched(true);

    return () => {
      window.matchMedia = original;
    };
  }, []);

  return isPatched ? <>{children}</> : null;
}

const getFades = (canvasElement: HTMLElement) => {
  const [left, right] = Array.from(canvasElement.querySelectorAll('[aria-hidden="true"]'));

  return { left, right };
};

const meta = {
  title: "Core/Components/TabBar",
  component: TabBar,
  tags: ["autodocs"],
  args: {
    tabs,
    activeIndex: 0,
    onChange: fn(),
  },
  decorators: [
    (Story, { parameters }) => (
      <div className="bg-card" style={{ width: parameters.containerWidth ?? "100%" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TabBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Wide: Story = {
  parameters: { containerWidth: 1200 },
  play: async ({ canvasElement }) => {
    const { left, right } = getFades(canvasElement);

    await waitFor(() => {
      expect(left).toHaveClass("opacity-0");
      expect(right).toHaveClass("opacity-0");
    });
  },
};

export const Narrow: Story = {
  parameters: { containerWidth: 360 },
  play: async ({ canvasElement }) => {
    const { left, right } = getFades(canvasElement);

    await waitFor(() => {
      expect(left).toHaveClass("opacity-0");
      expect(right).toHaveClass("opacity-100");
    });
  },
};

export const NarrowLastTabActive: Story = {
  args: { activeIndex: TAB_LABELS.length - 1 },
  parameters: { containerWidth: 360 },
  play: async ({ canvasElement }) => {
    const { left, right } = getFades(canvasElement);

    await waitFor(() => {
      expect(left).toHaveClass("opacity-100");
      expect(right).toHaveClass("opacity-0");
    });
  },
};

function InteractiveDemo() {
  const [activeIndex, setActiveIndex] = useState(0);

  return <TabBar tabs={tabs} activeIndex={activeIndex} onChange={setActiveIndex} />;
}

/** Click tabs or rest the mouse near an edge to scroll. */
export const Interactive: Story = {
  parameters: { containerWidth: 360 },
  render: () => <InteractiveDemo />,
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
    const { right } = getFades(canvasElement);

    await waitFor(() => expect(right).toHaveClass("opacity-100"));
  },
};
