import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { STORYBOOK_CLUSTER_NAME, withAppProviders } from "@sb/index";
import { DialogContextProvider } from "@/core/providers/Dialog/provider";
import { FilterProvider } from "@/core/providers/Filter";
import { LS_KEY_PIPELINERUN_VIEWS } from "@/core/services/local-storage/keys";
import { pipelineRunFilterProviderProps } from "@/modules/platform/tekton/components/PipelineRunList/components/Filter/constants";
import { PIPELINERUN_VIEWS_MAX_PER_CLUSTER } from "../../constants";
import type { PipelineRunView } from "../../types";
import { PipelineRunViewTabs } from "./index";

const view = (id: string, name: string, filters: PipelineRunView["filters"]): PipelineRunView => ({
  id,
  name,
  filters,
  createdAt: 1,
  updatedAt: 1,
});

const seedViews = (views: PipelineRunView[]) => () => {
  const previous = localStorage.getItem(LS_KEY_PIPELINERUN_VIEWS);
  localStorage.setItem(
    LS_KEY_PIPELINERUN_VIEWS,
    JSON.stringify({ version: 1, clusters: { [STORYBOOK_CLUSTER_NAME]: views } })
  );
  return () => {
    if (previous === null) {
      localStorage.removeItem(LS_KEY_PIPELINERUN_VIEWS);
    } else {
      localStorage.setItem(LS_KEY_PIPELINERUN_VIEWS, previous);
    }
  };
};

const meta = {
  title: "Modules/Tekton/PipelineRunList/PipelineRunViewTabs",
  component: PipelineRunViewTabs,
  parameters: { layout: "padded" },
  tags: ["autodocs"],
  decorators: [
    withAppProviders({
      contentWrapper: ({ children }) => (
        <DialogContextProvider>
          <FilterProvider {...pipelineRunFilterProviderProps}>{children}</FilterProvider>
        </DialogContextProvider>
      ),
    }),
  ],
} satisfies Meta<typeof PipelineRunViewTabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoViews: Story = {
  beforeEach: seedViews([]),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("tab", { name: "All runs" })).toHaveAttribute("aria-selected", "true");
    await expect(canvas.getByRole("button", { name: /Add view/ })).toBeEnabled();
  },
};

export const WithViews: Story = {
  beforeEach: seedViews([
    view("v_projects", "My projects", { codebases: ["codemie", "codemie-ui"] }),
    view("v_failed", "Failed builds", { pipelineType: "build", status: "failed" }),
  ]),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tab = await canvas.findByRole("tab", { name: "My projects" });

    await userEvent.click(tab);

    await expect(tab).toHaveAttribute("aria-selected", "true");
    await expect(tab).toHaveAttribute("aria-haspopup", "menu");
    await expect(tab).not.toHaveTextContent("(modified)");
  },
};

export const ManyViews: Story = {
  beforeEach: seedViews(
    Array.from({ length: 12 }, (_, index) =>
      view(`v_${index}`, `Team ${index + 1} review and build runs`, { codebases: [`app-${index}`] })
    )
  ),
};

export const AtLimit: Story = {
  beforeEach: seedViews(
    Array.from({ length: PIPELINERUN_VIEWS_MAX_PER_CLUSTER }, (_, index) => view(`v_${index}`, `View ${index}`, {}))
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("button", { name: /Add view/ })).toBeDisabled();
  },
};
