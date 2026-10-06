import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { useForm } from "@tanstack/react-form";
import type { Application, Codebase } from "@my-project/shared";
import { ApplicationsFormContext } from "../../hooks/useApplicationsForm";
import type { ApplicationsFormValues } from "../../types";
import { ValuesOverrideConfigurationColumn } from "./ValuesOverrideConfiguration";

const appCodebase = { metadata: { name: "test-go-app" } } as Codebase;
const withSources = { spec: { sources: [] } } as unknown as Application;
const withoutSources = { spec: {} } as unknown as Application;

const FormDecorator = ({ children, enabled }: { children: React.ReactNode; enabled: boolean }) => {
  const form = useForm({
    defaultValues: { "values-override": enabled, "test-go-app::values-override": enabled } as ApplicationsFormValues,
  });
  return <ApplicationsFormContext.Provider value={form}>{children}</ApplicationsFormContext.Provider>;
};

const meta = {
  title: "CDPipelines/Stage/Values Override Configuration Column",
  component: ValuesOverrideConfigurationColumn,
  parameters: { layout: "centered" },
  args: { appCodebase },
} satisfies Meta<typeof ValuesOverrideConfigurationColumn>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Form value matches the deployed state and the GitOps link is available. */
export const InSyncWithGitOpsLink: Story = {
  args: {
    application: withSources,
    gitOpsValuesLink: (appName) => `https://git.example.com/gitops/blob/main/demo/dev/${appName}-values.yaml`,
  },
  decorators: [(Story) => <FormDecorator enabled>{<Story />}</FormDecorator>],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("switch")).toBeChecked();
    await expect(canvas.getByRole("link")).toHaveAttribute(
      "href",
      "https://git.example.com/gitops/blob/main/demo/dev/test-go-app-values.yaml"
    );
  },
};

/** Form value differs from the deployed state: the mutation warning renders, no link without a GitOps URL. */
export const PendingChangeWithoutGitOpsLink: Story = {
  args: { application: withoutSources, gitOpsValuesLink: undefined },
  decorators: [(Story) => <FormDecorator enabled>{<Story />}</FormDecorator>],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("switch")).toBeChecked();
    await expect(canvas.queryByRole("link")).toBeNull();
  },
};
