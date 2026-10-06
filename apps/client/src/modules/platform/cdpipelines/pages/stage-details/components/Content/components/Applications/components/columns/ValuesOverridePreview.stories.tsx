import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { useForm } from "@tanstack/react-form";
import type { Codebase } from "@my-project/shared";
import { ApplicationsFormContext } from "../../hooks/useApplicationsForm";
import type { ApplicationsFormValues } from "../../types";
import { ValuesOverridePreviewColumn } from "./ValuesOverridePreview";

const appCodebase = { metadata: { name: "test-go-app" } } as Codebase;

const FormDecorator = ({ children, enabled }: { children: React.ReactNode; enabled: boolean }) => {
  const form = useForm({
    defaultValues: { "values-override": enabled, "test-go-app::values-override": enabled } as ApplicationsFormValues,
  });
  return <ApplicationsFormContext.Provider value={form}>{children}</ApplicationsFormContext.Provider>;
};

const meta = {
  title: "CDPipelines/Stage/Values Override Preview Column",
  component: ValuesOverridePreviewColumn,
  parameters: { layout: "centered" },
  args: { appCodebase },
} satisfies Meta<typeof ValuesOverridePreviewColumn>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Override on, GitOps link available: switch is checked and the source link renders. */
export const WithGitOpsLink: Story = {
  args: {
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

/** No GitOps web URL yet: only the read-only switch renders. */
export const WithoutGitOpsLink: Story = {
  args: { gitOpsValuesLink: undefined },
  decorators: [(Story) => <FormDecorator enabled={false}>{<Story />}</FormDecorator>],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("switch")).not.toBeChecked();
    await expect(canvas.queryByRole("link")).toBeNull();
  },
};
