import type { Meta, StoryObj } from "@storybook/react-vite";
import { withAppProviders } from "@sb/index";
import { Networking } from "./index";
import { mockPopulated, mockEmpty, mockCRDAbsent, mockRBACDenied } from "./mock";

const meta = {
  title: "CDPipelines/Stage/Networking Tab",
  component: Networking,
  parameters: { layout: "fullscreen" },
  decorators: [withAppProviders()],
} satisfies Meta<typeof Networking>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default: Kiali-style exposure topology (graph is the hero). Click a node for the detail drawer. */
export const Populated: Story = {
  args: { data: mockPopulated, state: "ok", defaultView: "graph" },
};

/** Detail drawer pre-opened on the "backend" HTTPRoute node (deep-link preview). */
export const WithDrawerOpen: Story = {
  args: { data: mockPopulated, state: "ok", defaultView: "graph", initialSelected: mockPopulated.httpRoutes[0] },
};

/** List view: the dense per-resource cards (secondary view, behind the Graph/List toggle). */
export const ListView: Story = {
  args: { data: mockPopulated, state: "ok", defaultView: "list" },
};

/**
 * App-scoped variant (deployment view): the graph is filtered to one Application's
 * exposure path — Internet → Gateway → its HTTPRoute → its Service → its Pods.
 */
export const AppScoped: Story = {
  args: { data: mockPopulated, state: "ok", defaultView: "graph", appName: "backend" },
};

/** CRDs installed, namespace is empty — zero resources of any kind. */
export const Empty: Story = {
  args: { data: mockEmpty, state: "empty" },
};

/** Gateway API CRDs not installed (404 from all Gateway/HTTPRoute watches). */
export const GatewayAPIAbsent: Story = {
  args: { data: mockCRDAbsent, state: "crd-absent", defaultView: "list" },
};

/** RBAC 403 on Gateway API watches. */
export const RBACDenied: Story = {
  args: { data: mockRBACDenied, state: "rbac-denied", defaultView: "list" },
};
