import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { STORYBOOK_CLUSTER_NAME, withAppProviders } from "@sb/index";
import {
  CRASHED_ACTOR,
  GONE_TEMPLATE_ACTOR,
  PLAIN_ACTOR,
  RUNNING_ACTOR,
  STORY_FLEET,
  seedFleet,
} from "../../../__fixtures__/storyFleet";
import { PAGE_DESCRIPTION, TERM_HINT } from "../../../constants/hints";
import { ActorDetailView, type ActorDetailViewProps } from "./view";

const meta = {
  title: "Modules/AgentSubstrate/ActorDetailView",
  component: ActorDetailView,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [withAppProviders({ seedQueryCache: seedFleet(STORY_FLEET) })],
  args: {
    atespace: RUNNING_ACTOR.atespace,
    name: RUNNING_ACTOR.name,
    tab: "summary",
    onTabChange: fn(),
  },
} satisfies Meta<typeof ActorDetailView>;

export default meta;
type Story = StoryObj<typeof meta>;

const panel = async (canvasElement: HTMLElement, name: string) =>
  within(await within(canvasElement).findByRole("region", { name }));

/** The value of a term: the `dd` after its `dt`. */
const fact = (scope: ReturnType<typeof within>, term: string) =>
  scope.getByText(term, { selector: "dt" }).nextElementSibling;

export const Summary: Story = {
  play: async ({ canvasElement, args }) => {
    const summary = await panel(canvasElement, "Summary");

    await expect(within(fact(summary, "Agent")!).getByRole("link", { name: "krci/test-go-app#25" })).toHaveAttribute(
      "href",
      `/c/${STORYBOOK_CLUSTER_NAME}/factory/agents/${RUNNING_ACTOR.atespace}/${RUNNING_ACTOR.name}`
    );
    for (const term of ["Issue", "Codebase", "Agent profile"]) {
      await expect(summary.queryByText(term, { selector: "dt" })).toBeNull();
    }
    await expect(summary.queryByRole("link", { name: "test-go-app" })).toBeNull();
    await expect(summary.getByText("claude-haiku-5-5")).toBeVisible();
    await expect(summary.getByText(RUNNING_ACTOR.actorTemplate)).toBeVisible();

    await expect(within(canvasElement).getByText(PAGE_DESCRIPTION.actorDetail)).toBeVisible();

    await userEvent.click(within(canvasElement).getByRole("button", { name: "Runtime" }));
    await expect(args.onTabChange).toHaveBeenCalledWith("runtime");
  },
};

export const SummaryWorkerSelectorAndSize: Story = {
  play: async ({ canvasElement }) => {
    const summary = await panel(canvasElement, "Summary");
    const body = within(canvasElement.ownerDocument.body);

    await expect(fact(summary, "Size")).toHaveTextContent("1.0 CPU, 2.0 Gi");
    await expect(fact(summary, "Worker selector")).toHaveTextContent("workload=workers");
    await expect(fact(summary, "Worker pools")).toHaveTextContent("krci-agents/workers, krci-agents/workers-microvm");

    await userEvent.hover(summary.getByRole("button", { name: "About Worker selector" }));
    await expect(await body.findByRole("tooltip")).toHaveTextContent(TERM_HINT.workerSelector);
    for (const term of ["Atespace", "Actor template", "Actor state", "Size", "Worker pools"]) {
      await expect(summary.getByRole("button", { name: `About ${term}` })).toBeVisible();
    }
  },
};

export const SummaryNoWorkerSelectorNoSize: Story = {
  args: { atespace: PLAIN_ACTOR.atespace, name: PLAIN_ACTOR.name },
  play: async ({ canvasElement }) => {
    const summary = await panel(canvasElement, "Summary");

    await expect(fact(summary, "Size")).toHaveTextContent(/^—$/);
    await expect(fact(summary, "Worker selector")).toHaveTextContent("Any worker");
    await expect(fact(summary, "Worker pools")).toHaveTextContent("krci-agents/workers, krci-agents/workers-microvm");
  },
};

export const SummaryActorTemplateGone: Story = {
  decorators: [
    withAppProviders({
      seedQueryCache: seedFleet({ ...STORY_FLEET, actors: [...STORY_FLEET.actors, GONE_TEMPLATE_ACTOR] }),
    }),
  ],
  args: { atespace: GONE_TEMPLATE_ACTOR.atespace, name: GONE_TEMPLATE_ACTOR.name },
  play: async ({ canvasElement }) => {
    const summary = await panel(canvasElement, "Summary");

    for (const term of ["Size", "Worker selector", "Worker pools"]) {
      await expect(fact(summary, term)).toHaveTextContent(/^—$/);
    }
    await expect(summary.queryByText("Any worker")).toBeNull();
  },
};

export const Runtime: Story = {
  args: { tab: "runtime" },
  play: async ({ canvasElement }) => {
    const runtime = await panel(canvasElement, "Runtime");

    await expect(runtime.getByText("workers-7c9f6")).toBeVisible();
    await expect(runtime.getByText("krci-agents/workers")).toBeVisible();
    await expect(runtime.getByText("workers-7c9f6-0").previousElementSibling).toHaveTextContent("Worker pod");
    await expect(runtime.getByText("krci-control-plane")).toBeVisible();
    await expect(runtime.getByText("gvisor")).toBeVisible();
  },
};

function RoutedActorDetailView(props: ActorDetailViewProps) {
  const [tab, setTab] = React.useState(props.tab);
  return (
    <ActorDetailView
      {...props}
      tab={tab}
      onTabChange={(next) => {
        props.onTabChange(next);
        setTab(next);
      }}
    />
  );
}

export const SnapshotSortKeptAcrossTabs: Story = {
  args: { tab: "snapshot" },
  render: (args) => <RoutedActorDetailView {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const generationHeader = () => within(canvasElement).getByRole("columnheader", { name: "Generation" });

    await panel(canvasElement, "Snapshot");
    const initialSort = generationHeader().getAttribute("aria-sort");
    const sortButton = within(generationHeader()).getByRole("button", { name: "Generation" });
    const hintButton = within(generationHeader()).getByRole("button", { name: "About Generation" });
    await expect(sortButton.contains(hintButton)).toBe(false);
    await userEvent.click(sortButton);
    const changedSort = generationHeader().getAttribute("aria-sort");
    await expect(changedSort).not.toBe(initialSort);

    await userEvent.click(canvas.getByRole("button", { name: "Runtime" }));
    await panel(canvasElement, "Runtime");
    await userEvent.click(canvas.getByRole("button", { name: "Snapshot" }));
    await panel(canvasElement, "Snapshot");

    await expect(generationHeader()).toHaveAttribute("aria-sort", changedSort!);
  },
};

export const RuntimeSuspended: Story = {
  args: { atespace: "krci-agents", name: "issue-2-26", tab: "runtime" },
  play: async ({ canvasElement }) => {
    const runtime = await panel(canvasElement, "Runtime");
    await expect(runtime.getByText("The actor runs on no worker while it is suspended.")).toBeVisible();
  },
};

export const Snapshot: Story = {
  args: { tab: "snapshot" },
  play: async ({ canvasElement }) => {
    const snapshots = await panel(canvasElement, "Snapshot");
    const rows = await snapshots.findAllByRole("row");

    await expect(within(rows[1]).getByText("2")).toBeVisible();
    await expect(within(rows[1]).getByText("rootfs")).toBeVisible();
    await expect(within(rows[1]).getByText("krci-control-plane")).toBeVisible();
    await expect(within(rows[1]).getByText("pending")).toBeVisible();
    await expect(within(rows[2]).getByText("memory")).toBeVisible();
    await expect(within(rows[2]).getByText("No node")).toBeVisible();
    await expect(within(rows[2]).getByText("completed")).toBeVisible();
  },
};

export const SnapshotNone: Story = {
  args: { atespace: PLAIN_ACTOR.atespace, name: PLAIN_ACTOR.name, tab: "snapshot" },
  play: async ({ canvasElement }) => {
    const snapshots = await panel(canvasElement, "Snapshot");
    await expect(snapshots.getByText("The actor has no snapshots")).toBeVisible();
  },
};

export const Crashed: Story = {
  args: { atespace: CRASHED_ACTOR.atespace, name: CRASHED_ACTOR.name },
  play: async ({ canvasElement }) => {
    const summary = await panel(canvasElement, "Summary");

    await expect(summary.getByRole("alert")).toHaveTextContent(CRASHED_ACTOR.crash!.message);
    await expect(summary.getByText("crashed")).toBeVisible();
    await expect(summary.getByRole("link", { name: "krci/test-python-app#4" })).toHaveAttribute(
      "href",
      `/c/${STORYBOOK_CLUSTER_NAME}/factory/agents/${CRASHED_ACTOR.atespace}/${CRASHED_ACTOR.name}`
    );
  },
};

export const NotMadeByDispatcher: Story = {
  args: { atespace: PLAIN_ACTOR.atespace, name: PLAIN_ACTOR.name },
  play: async ({ canvasElement }) => {
    const summary = await panel(canvasElement, "Summary");

    await expect(summary.getByText("unknown")).toBeVisible();
    for (const term of ["Agent", "Model"]) {
      await expect(summary.getByText(term).nextElementSibling).toHaveTextContent(/^—$/);
    }
  },
};

export const NotFound: Story = {
  args: { atespace: "krci-agents", name: "issue-9-9" },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("Actor not found")).toBeVisible();
  },
};
