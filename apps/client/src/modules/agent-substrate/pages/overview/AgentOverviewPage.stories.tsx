import type { Meta, StoryObj } from "@storybook/react-vite";
import type { FleetUnreachableReason, ReadyFleetSnapshot } from "@my-project/shared";
import { expect, within } from "storybook/test";
import { STORYBOOK_CLUSTER_NAME, withAppProviders } from "@sb/index";
import {
  BUSY_WORKER,
  CRASHED_ACTOR,
  CRASHED_ACTOR_ITEM,
  CRASHED_ACTOR_FLEET,
  DRAINING_WORKER_FLEET,
  EMPTY_FLEET,
  HEALTHY_FLEET,
  MANY_CRASHED_COUNT,
  MANY_CRASHED_FLEET,
  MICROVM_WORKER,
  NO_ATESPACES_DRAINING_WORKER_FLEET,
  NOT_READY_FLEET,
  PENDING_SNAPSHOT_FLEET,
  RUNNING_ACTOR,
  TESTBED_FLEET,
  PARTIAL_WORKER_POOLS_FLEET,
  WORKER_POOLS_DENIED_FLEET,
  WORKERS_NOT_ACTIVE_FLEET,
  seedFleet,
} from "../../__fixtures__/storyFleet";
import AgentOverviewPage from "./page";
import { NEEDS_ATTENTION_MAX_ROWS } from "./utils/needsAttention";

const AGENT = `/c/${STORYBOOK_CLUSTER_NAME}/agent`;

type Canvas = ReturnType<typeof within>;

function unreachable(reason: FleetUnreachableReason, label: string): Story {
  return {
    decorators: [withAppProviders({ seedQueryCache: seedFleet({ state: "unreachable", reason }) })],
    play: async ({ canvasElement }) => {
      const canvas = within(canvasElement);
      await expect(await canvas.findByText("Agent Substrate is unreachable")).toBeVisible();
      await expect(canvas.getByText(`Reason: ${label}`)).toBeVisible();
      await expect(canvas.getByText("See the portal server logs for the error.")).toBeVisible();
    },
  };
}

const withFleet = (fleet: ReadyFleetSnapshot) => [withAppProviders({ seedQueryCache: seedFleet(fleet) })];

async function needsAttention(canvasElement: HTMLElement): Promise<Canvas> {
  return within(await within(canvasElement).findByRole("region", { name: "Needs attention" }));
}

const group = (section: Canvas, title: RegExp) => within(section.getByRole("region", { name: title }));

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

export const UnreachableUnavailable = unreachable("unavailable", "network or TLS failure");

export const UnreachableUnauthenticated = unreachable("unauthenticated", "unauthenticated");

export const UnreachablePermissionDenied = unreachable("permissionDenied", "permission denied");

export const UnreachableOther = unreachable("other", "other error");

export const Empty: Story = {
  decorators: [withAppProviders({ seedQueryCache: seedFleet(EMPTY_FLEET) })],
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("Agent Substrate has no atespaces yet")).toBeVisible();
  },
};

/** The recorded testbed: healthy, WorkerPool list `error`. */
export const Ready: Story = {
  decorators: withFleet(TESTBED_FLEET),
  play: async ({ canvasElement }) => {
    const section = await needsAttention(canvasElement);
    await expect(
      section.getByText("Nothing needs attention in actors and workers; worker pools not checked (error)")
    ).toBeVisible();
    await expect(section.getByText("Checked 6 actors and 1 worker.")).toBeVisible();

    const counts = within(within(canvasElement).getByRole("region", { name: "Actor counts" }));
    const tile = (title: string) => within(counts.getByText(title).parentElement!);

    await expect(tile("Agents").getByText(String(TESTBED_FLEET.summary.agents))).toBeVisible();
    await expect(tile("Actors").getByText(String(TESTBED_FLEET.summary.actors))).toBeVisible();
    await expect(tile("Suspended").getByText(String(TESTBED_FLEET.summary.actorsByState.suspended))).toBeVisible();
    await expect(tile("Crashed").getByText("0")).toBeVisible();
  },
};

export const HealthyFleet: Story = {
  decorators: withFleet(HEALTHY_FLEET),
  play: async ({ canvasElement }) => {
    const section = await needsAttention(canvasElement);

    await expect(section.getByText("Nothing needs attention")).toBeVisible();
    await expect(
      section.getByText(
        `Checked ${HEALTHY_FLEET.summary.actors} actors, ${HEALTHY_FLEET.summary.workers} workers and ${HEALTHY_FLEET.workerPools.items.length} worker pools.`
      )
    ).toBeVisible();
    await expect(section.queryByRole("region")).toBeNull();
  },
};

export const CrashedActor: Story = {
  decorators: withFleet(CRASHED_ACTOR_FLEET),
  play: async ({ canvasElement }) => {
    const crashed = group(await needsAttention(canvasElement), /^Crashed actors \(1\)/);

    await expect(crashed.getByRole("listitem")).toHaveTextContent(/^Error/);
    await expect(crashed.getByRole("link", { name: CRASHED_ACTOR.name })).toHaveAttribute(
      "href",
      `${AGENT}/actors/${CRASHED_ACTOR.atespace}/${CRASHED_ACTOR.name}`
    );
    await expect(crashed.getByText(CRASHED_ACTOR.crash!.message)).toBeVisible();
    await expect(crashed.getByRole("link", { name: "krci/test-python-app#4" })).toHaveAttribute(
      "href",
      CRASHED_ACTOR.agent!.issue.url!
    );
    await expect(crashed.getByText("python")).toBeVisible();
    await expect(canvasElement.querySelector(`time[datetime="${CRASHED_ACTOR_ITEM.crashedAt}"]`)).not.toBeNull();
    await expect(crashed.queryByRole("link", { name: /^Show all/ })).toBeNull();
  },
};

export const WorkerPoolNotReady: Story = {
  decorators: withFleet(NOT_READY_FLEET),
  play: async ({ canvasElement }) => {
    const section = await needsAttention(canvasElement);
    const pools = group(section, /^Worker pools not ready \(2\)/);

    await expect(pools.getByRole("link", { name: "workers-spare" })).toHaveAttribute(
      "href",
      `${AGENT}/worker-pools#worker-pool/krci-agents/workers-spare`
    );
    await expect(pools.getByText("0/2 ready")).toBeVisible();
    await expect(pools.getByText("1/2 ready")).toBeVisible();

    const groups = section.getAllByRole("region");
    await expect(groups).toHaveLength(3);
    await expect(groups[0]).toHaveAccessibleName(/^Crashed actors \(1\)/);
    await expect(groups[1]).toHaveAccessibleName(/^Worker pools not ready \(2\)/);
    await expect(groups[2]).toHaveAccessibleName(/^Pending snapshots \(1\)/);
  },
};

export const DrainingWorker: Story = {
  decorators: withFleet(DRAINING_WORKER_FLEET),
  play: async ({ canvasElement }) => {
    const draining = group(await needsAttention(canvasElement), /^Workers not active \(1\)/);

    await expect(draining.getByRole("listitem")).toHaveTextContent(/^Warning/);
    await expect(draining.getByText("draining")).toBeVisible();
    await expect(draining.getByRole("link", { name: BUSY_WORKER.name })).toHaveAttribute(
      "href",
      `${AGENT}/workers#worker/${BUSY_WORKER.workerNamespace}/${BUSY_WORKER.workerPool}/${BUSY_WORKER.name}`
    );
    await expect(
      draining.getByText(`Worker pool ${BUSY_WORKER.workerNamespace}/${BUSY_WORKER.workerPool}`)
    ).toBeVisible();
  },
};

export const PendingSnapshot: Story = {
  decorators: withFleet(PENDING_SNAPSHOT_FLEET),
  play: async ({ canvasElement }) => {
    const pending = group(await needsAttention(canvasElement), /^Pending snapshots \(1\)/);

    await expect(pending.getByRole("link", { name: RUNNING_ACTOR.name })).toHaveAttribute(
      "href",
      `${AGENT}/actors/${RUNNING_ACTOR.atespace}/${RUNNING_ACTOR.name}?tab=snapshot`
    );
    await expect(pending.getByText("Snapshot generation 2 pending")).toBeVisible();
    await expect(canvasElement.querySelector(`time[datetime="${RUNNING_ACTOR.updatedAt}"]`)).not.toBeNull();
  },
};

export const WorkerPoolsDenied: Story = {
  decorators: withFleet(WORKER_POOLS_DENIED_FLEET),
  play: async ({ canvasElement }) => {
    const section = await needsAttention(canvasElement);

    await expect(section.getByText("Worker pools not checked: no access")).toBeVisible();
    await expect(section.getByRole("region", { name: /^Crashed actors/ })).toBeVisible();
    await expect(section.queryByRole("region", { name: /^Worker pools not ready/ })).toBeNull();
  },
};

export const WorkerPoolsPartlyDenied: Story = {
  decorators: withFleet(PARTIAL_WORKER_POOLS_FLEET),
  play: async ({ canvasElement }) => {
    const section = await needsAttention(canvasElement);

    await expect(section.getByText("Some worker pools not checked: no access")).toBeVisible();
    const pools = group(section, /^Worker pools not ready \(1\)/);
    await expect(pools.getByRole("link", { name: "workers" })).toBeVisible();
    await expect(pools.getByText("1/2 ready")).toBeVisible();
  },
};

export const HealthyFleetWorkerPoolsDenied: Story = {
  decorators: withFleet({ ...HEALTHY_FLEET, workerPools: { ...WORKER_POOLS_DENIED_FLEET.workerPools } }),
  play: async ({ canvasElement }) => {
    const section = await needsAttention(canvasElement);

    await expect(
      section.getByText("Nothing needs attention in actors and workers; worker pools not checked (no access)")
    ).toBeVisible();
  },
};

export const MoreThanFiveCrashedActors: Story = {
  decorators: withFleet(MANY_CRASHED_FLEET),
  play: async ({ canvasElement }) => {
    const crashed = group(
      await needsAttention(canvasElement),
      new RegExp(`^Crashed actors \\(${MANY_CRASHED_COUNT}\\)`)
    );

    const rows = crashed.getAllByRole("listitem");
    await expect(rows).toHaveLength(NEEDS_ATTENTION_MAX_ROWS);
    await expect(within(rows[0]).getByRole("link", { name: "crashed-1" })).toBeVisible();
    await expect(crashed.queryByRole("link", { name: `crashed-${NEEDS_ATTENTION_MAX_ROWS + 1}` })).toBeNull();
    await expect(crashed.getByRole("link", { name: "Show all crashed actors" })).toHaveAttribute(
      "href",
      `${AGENT}/actors?actorState=crashed`
    );
  },
};

export const WorkersNotActive: Story = {
  decorators: withFleet(WORKERS_NOT_ACTIVE_FLEET),
  play: async ({ canvasElement }) => {
    const workers = group(await needsAttention(canvasElement), /^Workers not active \(2\)/);

    const [unavailable, draining] = workers.getAllByRole("listitem");
    await expect(unavailable).toHaveTextContent(/^Error/);
    await expect(within(unavailable).getByRole("link", { name: MICROVM_WORKER.name })).toBeVisible();
    await expect(draining).toHaveTextContent(/^Warning/);
    await expect(within(draining).getByRole("link", { name: BUSY_WORKER.name })).toBeVisible();
  },
};

export const NoAtespacesDrainingWorker: Story = {
  decorators: withFleet(NO_ATESPACES_DRAINING_WORKER_FLEET),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const section = await canvas.findByRole("region", { name: "Needs attention" });
    const empty = canvas.getByText("Agent Substrate has no atespaces yet");

    await expect(within(section).getByRole("region", { name: /^Workers not active \(1\)/ })).toBeVisible();
    await expect(section.compareDocumentPosition(empty) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  },
};
