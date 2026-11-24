import type { Meta, StoryObj } from "@storybook/react-vite";
import { TRPCClientError } from "@trpc/client";
import { TRPC_ERROR_CODES_BY_KEY } from "@trpc/server/rpc";
import { LayoutDashboard } from "lucide-react";
import { expect, within } from "storybook/test";
import { withAppProviders } from "@sb/index";
import type { RequestError } from "@/core/types/global";
import { TESTBED_FLEET } from "../../__fixtures__/storyFleet";
import { FleetPageView } from "./index";

const UPDATED_AT = Date.UTC(2026, 10, 22, 10, 0, 0);

const internalError: RequestError = TRPCClientError.from({
  error: {
    code: TRPC_ERROR_CODES_BY_KEY.INTERNAL_SERVER_ERROR,
    message: "getFleet failed",
    data: { code: "INTERNAL_SERVER_ERROR", httpStatus: 500 },
  },
});

const meta = {
  title: "Modules/AgentSubstrate/FleetPageView",
  component: FleetPageView,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [withAppProviders()],
  args: {
    icon: LayoutDashboard,
    title: "Fleet Overview",
    breadcrumbs: [{ label: "Overview" }],
    error: null,
    dataUpdatedAt: UPDATED_AT,
    isFetching: false,
    onRefresh: () => {},
  },
} satisfies Meta<typeof FleetPageView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  args: { dataUpdatedAt: 0, isFetching: true },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("Loading...")).toBeInTheDocument();
  },
};

export const NotConfigured: Story = {
  args: { snapshot: { state: "notConfigured" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Agent Substrate is not configured")).toBeVisible();
    await expect(canvas.getByText(/AGENT_SUBSTRATE_URL/)).toBeVisible();
  },
};

export const Unreachable: Story = {
  args: {
    snapshot: { state: "unreachable", reason: "permissionDenied" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Agent Substrate is unreachable")).toBeVisible();
    await expect(canvas.getByText("Reason: permission denied")).toBeVisible();
  },
};

export const StaleAfterFailedRefresh: Story = {
  args: { snapshot: { state: "notConfigured" }, error: internalError },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Refresh failed")).toHaveClass("text-status-missing");
    await expect(canvas.getByText("Agent Substrate is not configured")).toBeVisible();
  },
};

export const KeptFleetAfterUnreachableRefresh: Story = {
  args: {
    snapshot: { ...TESTBED_FLEET, refreshFailure: "unavailable" },
    children: (fleet) => <p>{`${fleet.actors.length} actors`}</p>,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(`${TESTBED_FLEET.actors.length} actors`)).toBeVisible();
    await expect(canvas.getByText("Agent Substrate unreachable: network or TLS failure")).toHaveClass(
      "text-status-missing"
    );
    await expect(canvas.queryByText("Agent Substrate is unreachable")).toBeNull();
  },
};

export const KeptFleetThenFailedRefresh: Story = {
  args: {
    snapshot: { ...TESTBED_FLEET, refreshFailure: "unavailable" },
    error: internalError,
    children: (fleet) => <p>{`${fleet.actors.length} actors`}</p>,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Refresh failed")).toBeVisible();
    await expect(canvas.queryByText(/^Agent Substrate unreachable/)).toBeNull();
    await expect(canvas.getByText(`${TESTBED_FLEET.actors.length} actors`)).toBeVisible();
  },
};

export const KeptFleetUnknownReason: Story = {
  args: {
    snapshot: { ...TESTBED_FLEET, refreshFailure: "timeout" as unknown as "other" },
    children: () => null,
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("Agent Substrate unreachable: other error")).toBeVisible();
  },
};

export const ErrorBeforeFirstRead: Story = {
  args: { dataUpdatedAt: 0, error: internalError },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("Something went wrong. Contact your administrator.")).toBeVisible();
  },
};
