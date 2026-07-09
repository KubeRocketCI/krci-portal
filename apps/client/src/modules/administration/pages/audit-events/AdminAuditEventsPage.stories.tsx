import type { Meta, StoryObj } from "@storybook/react-vite";
import { withAppProviders } from "@sb/index";
import type { KrciAuditEvent, KrciAuditEventsResponse } from "@my-project/shared";
import AdminAuditEventsPage from "./page";
import { defaultAuditEventFilterValues } from "./components/AuditEventFilter/constants";
import { toAuditEventsQueryInput } from "./hooks/useAuditEvents";

const sampleEvents: KrciAuditEvent[] = [
  {
    eventUid: "event-1",
    receivedAt: "2026-07-08T10:00:00Z",
    operation: "CREATE",
    apiGroup: "tekton.dev",
    apiVersion: "v1",
    resource: "pipelineruns",
    kind: "PipelineRun",
    namespace: "krci",
    name: "build-test-go-app-main-8a2c",
    username: "kubernetes-admin",
    dryRun: false,
  },
  {
    eventUid: "event-2",
    receivedAt: "2026-07-08T09:00:00Z",
    operation: "UPDATE",
    apiGroup: "v2.edp.epam.com",
    apiVersion: "v1",
    resource: "codebases",
    kind: "Codebase",
    namespace: "krci",
    name: "test-go-app",
    username: "system:serviceaccount:krci:krci-admin",
    dryRun: false,
  },
];

function seedAuditEvents(response: KrciAuditEventsResponse) {
  return (queryClient: import("@tanstack/react-query").QueryClient) => {
    const queryInput = toAuditEventsQueryInput(defaultAuditEventFilterValues);
    queryClient.setQueryData(["krciAudit", "getAuditEvents", queryInput], response);
  };
}

const meta = {
  title: "Modules/Administration/AdminAuditEventsPage",
  component: AdminAuditEventsPage,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof AdminAuditEventsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithEvents: Story = {
  decorators: [
    withAppProviders({
      seedQueryCache: seedAuditEvents({ data: sampleEvents, pagination: { total: 2, page: 1, perPage: 100 } }),
    }),
  ],
};

export const Empty: Story = {
  decorators: [
    withAppProviders({
      seedQueryCache: seedAuditEvents({ data: [], pagination: { total: 0, page: 1, perPage: 100 } }),
    }),
  ],
};
