import type { Meta, StoryObj } from "@storybook/react-vite";
import type { QueryClient } from "@tanstack/react-query";
import type { FleetSnapshot } from "@my-project/shared";
import { withAppProviders } from "@sb/index";
import { FLEET_QUERY_KEY } from "../../hooks/useFleet";
import AgentOverviewPage from "./page";

function seedFleet(snapshot: FleetSnapshot) {
  return (queryClient: QueryClient) => {
    queryClient.setQueryData(FLEET_QUERY_KEY, snapshot);
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
