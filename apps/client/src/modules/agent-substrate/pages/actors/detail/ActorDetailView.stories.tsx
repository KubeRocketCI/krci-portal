import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { withAppProviders } from "@sb/index";
import { CRASHED_ACTOR, PLAIN_ACTOR, RUNNING_ACTOR, STORY_FLEET, seedFleet } from "../../../__fixtures__/storyFleet";
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

export const Summary: Story = {
  play: async ({ canvasElement, args }) => {
    const summary = await panel(canvasElement, "Summary");

    await expect(summary.getByRole("link", { name: "krci/test-go-app#25" })).toHaveAttribute(
      "href",
      RUNNING_ACTOR.agent!.issue.url!
    );
    await expect(summary.getByRole("link", { name: "test-go-app" })).toBeVisible();
    await expect(summary.getByText("go")).toBeVisible();
    await expect(summary.getByText("claude-haiku-5-5")).toBeVisible();
    await expect(summary.getByText(RUNNING_ACTOR.actorTemplate)).toBeVisible();

    await userEvent.click(within(canvasElement).getByRole("button", { name: "Runtime" }));
    await expect(args.onTabChange).toHaveBeenCalledWith("runtime");
  },
};

export const Runtime: Story = {
  args: { tab: "runtime" },
  play: async ({ canvasElement }) => {
    const runtime = await panel(canvasElement, "Runtime");

    await expect(runtime.getByText("workers-7c9f6")).toBeVisible();
    await expect(runtime.getByText("krci-agents/workers")).toBeVisible();
    await expect(runtime.getByText("workers-7c9f6-0")).toBeVisible();
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
    await userEvent.click(within(generationHeader()).getByRole("button"));
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
    await expect(summary.getByRole("link", { name: "test-python-app" })).toBeVisible();
  },
};

export const NotMadeByDispatcher: Story = {
  args: { atespace: PLAIN_ACTOR.atespace, name: PLAIN_ACTOR.name },
  play: async ({ canvasElement }) => {
    const summary = await panel(canvasElement, "Summary");

    await expect(summary.getByText("unknown")).toBeVisible();
    for (const term of ["Issue", "Codebase", "Agent profile", "Model"]) {
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
