import type { Meta, StoryObj } from "@storybook/react-vite";
import type { FleetUnreachableReason } from "@my-project/shared";
import { expect, within } from "storybook/test";
import { withAppProviders } from "@sb/index";
import { EMPTY_FLEET, TESTBED_FLEET, seedFleet } from "../../__fixtures__/storyFleet";
import AgentOverviewPage from "./page";

function unreachable(reason: FleetUnreachableReason, label: string): Story {
  return {
    decorators: [withAppProviders({ seedQueryCache: seedFleet({ state: "unreachable", reason }) })],
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await expect(await canvas.findByText("Agent Substrate is unreachable")).toBeVisible();
      await expect(canvas.getByText(`Reason: ${label}`)).toBeVisible();
      await expect(canvas.getByText("See the portal server logs for the error.")).toBeVisible();
    },
  };
}

const meta = {
  title: "Modules/AgentSubstrate/AgentOverviewPage",
  component: AgentOverviewPage,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof AgentOverviewPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NotConfigured: Story = {
  decorators: [withAppProviders({ seedQueryCache: seedFleet({ state: "notConfigured" }) })],
};

export const UnreachableUnavailable = unreachable("unavailable", "network or TLS failure");

export const UnreachableUnauthenticated = unreachable("unauthenticated", "unauthenticated");

export const UnreachablePermissionDenied = unreachable("permissionDenied", "permission denied");

export const UnreachableOther = unreachable("other", "other error");

export const Empty: Story = {
  decorators: [withAppProviders({ seedQueryCache: seedFleet(EMPTY_FLEET) })],
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("Agent Substrate has no atespaces yet")).toBeVisible();
  },
};

export const Ready: Story = {
  decorators: [withAppProviders({ seedQueryCache: seedFleet(TESTBED_FLEET) })],
  play: async ({ canvasElement }) => {
    const counts = within(await within(canvasElement).findByRole("region", { name: "Actor counts" }));
    const tile = (title: string) => within(counts.getByText(title).parentElement!);

    await expect(tile("Agents").getByText(String(TESTBED_FLEET.summary.agents))).toBeVisible();
    await expect(tile("Actors").getByText(String(TESTBED_FLEET.summary.actors))).toBeVisible();
    await expect(tile("Suspended").getByText(String(TESTBED_FLEET.summary.actorsByState.suspended))).toBeVisible();
    await expect(tile("Crashed").getByText("0")).toBeVisible();
  },
};
