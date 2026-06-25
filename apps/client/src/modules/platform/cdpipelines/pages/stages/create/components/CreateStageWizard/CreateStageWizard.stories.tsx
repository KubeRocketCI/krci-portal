import type { Meta, StoryObj } from "@storybook/react-vite";
import type { QueryClient } from "@tanstack/react-query";
import { expect } from "storybook/test";
import { k8sTriggerTemplateConfig, pipelineType, triggerTemplateLabels } from "@my-project/shared";
import { getK8sWatchListQueryCacheKey } from "@/k8s/api/hooks/useWatch/query-keys";
import { TEST_CLUSTER_NAME, TEST_NAMESPACE } from "@/test/utils";
import { CreateStageWizard } from "./index";
import { withAppProviders } from "@sb/index";

const makeTriggerTemplate = (name: string, type: string) => ({
  apiVersion: k8sTriggerTemplateConfig.apiVersion,
  kind: k8sTriggerTemplateConfig.kind,
  metadata: { name, namespace: TEST_NAMESPACE, labels: { [triggerTemplateLabels.pipelineType]: type } },
  spec: {},
});

const mockTriggerTemplates = [
  makeTriggerTemplate("deploy-full-codemie", pipelineType.deploy),
  makeTriggerTemplate("clean", pipelineType.clean),
];

// The wizard now gates rendering until trigger templates finish loading, so the story must
// seed the watch-list cache — otherwise the watch stays on placeholder data and the form
// never mounts. Built via the production key helper so the seeded data lands on the exact key.
const seedTriggerTemplates = (queryClient: QueryClient) => {
  const items = new Map(mockTriggerTemplates.map((template) => [template.metadata.name, template]));

  queryClient.setQueryData(
    getK8sWatchListQueryCacheKey(
      TEST_CLUSTER_NAME,
      TEST_NAMESPACE,
      k8sTriggerTemplateConfig.group,
      k8sTriggerTemplateConfig.pluralName
    ),
    {
      apiVersion: k8sTriggerTemplateConfig.apiVersion,
      kind: `${k8sTriggerTemplateConfig.kind}List`,
      metadata: {},
      items,
    }
  );
};

const meta = {
  title: "Platform/CDPipelines/Wizards/CreateStageWizard",
  component: CreateStageWizard,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [
    withAppProviders({ seedQueryCache: seedTriggerTemplates }),
    (Story) => (
      <div className="p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CreateStageWizard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <CreateStageWizard />,
  play: async ({ canvas }) => {
    await expect(canvas.getAllByText(/basic configuration/i).length).toBeGreaterThan(0);
    await expect(canvas.getAllByText(/quality gates/i).length).toBeGreaterThan(0);
    await expect(canvas.getAllByText(/review/i).length).toBeGreaterThan(0);
    await expect(canvas.getByRole("button", { name: /continue/i })).toBeInTheDocument();
    await expect(canvas.getByRole("link", { name: /cancel/i })).toBeInTheDocument();
  },
};
