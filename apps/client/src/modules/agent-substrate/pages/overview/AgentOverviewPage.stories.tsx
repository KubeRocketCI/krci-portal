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
  FULL_WORKER_POOL_FLEET,
  HEALTHY_FLEET,
  MANY_CRASHED_COUNT,
  MANY_CRASHED_FLEET,
  MICROVM_WORKER,
  NO_ATESPACES_DRAINING_WORKER_FLEET,
  NOT_READY_FLEET,
  ONE_FULL_WORKER_POOL_FLEET,
  ONE_WORKER_POOL_FLEET,
  PENDING_SNAPSHOT_FLEET,
  RUNNING_ACTOR,
  SEVERAL_AGENT_PROFILES_FLEET,
  TESTBED_FLEET,
  PARTIAL_WORKER_POOLS_FLEET,
  UNREGISTERED_WORKER_FLEET,
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

async function atAGlance(canvasElement: HTMLElement): Promise<Canvas> {
  return within(await within(canvasElement).findByRole("region", { name: "At a glance" }));
}

async function capacity(canvasElement: HTMLElement): Promise<Canvas> {
  return within(await within(canvasElement).findByRole("region", { name: "Capacity" }));
}

const workerPoolCard = (section: Canvas, name: string) =>
  within(section.getByRole("region", { name: `Worker pool krci-agents/${name}` }));

/** The link of a stat card or of a count, by the label it starts with. */
const countLink = (scope: Canvas, label: string) => scope.getByRole("link", { name: new RegExp(`^${label}`) });

async function expectActorStateCounts(section: Canvas, fleet: ReadyFleetSnapshot) {
  const strip = group(section, /^Actor state$/);
  for (const [label, state] of [
    ["Running", "running"],
    ["Transitional", "transitional"],
    ["Suspended", "suspended"],
    ["Crashed", "crashed"],
    ["Unknown", "unknown"],
  ] as const) {
    const link = countLink(strip, label);
    await expect(link).toHaveTextContent(`${label}${fleet.summary.actorsByState[state]}`);
    await expect(link).toHaveAttribute("href", `${AGENT}/actors?actorState=${state}`);
  }
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

export const UnreachableUnavailable = unreachable("unavailable", "network or TLS failure");

export const UnreachableUnauthenticated = unreachable("unauthenticated", "unauthenticated");

export const UnreachablePermissionDenied = unreachable("permissionDenied", "permission denied");

export const UnreachableOther = unreachable("other", "other error");

export const Empty: Story = {
  decorators: [withAppProviders({ seedQueryCache: seedFleet(EMPTY_FLEET) })],
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("Agent Substrate has no atespaces yet")).toBeVisible();
    await expect(within(canvasElement).queryByRole("region", { name: "Capacity" })).toBeNull();
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

    const glance = await atAGlance(canvasElement);
    await expect(countLink(glance, "Agents")).toHaveTextContent("Agents6of 6 actors in 1 atespace");
    await expect(countLink(glance, "Workers")).toHaveTextContent("Workers1All active");
    await expect(countLink(glance, "Room")).toHaveTextContent("Room1across 1 worker pool");
    await expectActorStateCounts(glance, TESTBED_FLEET);
    const profiles = group(glance, /^Agents by agent profile$/);
    await expect(profiles.getAllByRole("link").map((link) => link.textContent)).toEqual(["go2", "node2", "python2"]);
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

    const glance = await atAGlance(canvasElement);
    await expect(countLink(glance, "Agents")).toHaveAttribute("href", `${AGENT}/actors`);
    await expect(countLink(glance, "Agents")).toHaveTextContent(
      `Agents${HEALTHY_FLEET.summary.agents}of ${HEALTHY_FLEET.summary.actors} actors in 2 atespaces`
    );
    await expect(countLink(glance, "Workers")).toHaveAttribute("href", `${AGENT}/workers`);
    await expect(countLink(glance, "Workers")).toHaveTextContent(`Workers${HEALTHY_FLEET.summary.workers}All active`);
    await expect(countLink(glance, "Room")).toHaveAttribute("href", `${AGENT}/worker-pools`);
    await expect(countLink(glance, "Room")).toHaveTextContent("Room11across 2 worker pools");
    await expectActorStateCounts(glance, HEALTHY_FLEET);
    await expect(within(countLink(group(glance, /^Actor state$/), "Crashed")).getByText("0")).not.toHaveClass(
      "text-status-error"
    );
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

    const glance = await atAGlance(canvasElement);
    await expectActorStateCounts(glance, CRASHED_ACTOR_FLEET);
    const crashedCount = countLink(group(glance, /^Actor state$/), "Crashed");
    await expect(within(crashedCount).getByText("1")).toHaveClass("text-status-error");
    await expect(within(crashedCount).getByRole("img", { name: "Needs attention" })).toBeVisible();
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

    const workers = countLink(await atAGlance(canvasElement), "Workers");
    await expect(workers).toHaveTextContent(`Workers${DRAINING_WORKER_FLEET.summary.workers}1 draining`);
    await expect(within(workers).getByText("1 draining")).toHaveClass("text-status-missing");
  },
};

export const UnregisteredWorker: Story = {
  decorators: withFleet(UNREGISTERED_WORKER_FLEET),
  play: async ({ canvasElement }) => {
    const workers = countLink(await atAGlance(canvasElement), "Workers");

    await expect(workers).toHaveTextContent(`Workers${UNREGISTERED_WORKER_FLEET.summary.workers}1 not registered`);
    await expect(within(workers).getByText("1 not registered")).toHaveClass("text-status-missing");
  },
};

export const NoRoom: Story = {
  decorators: withFleet(FULL_WORKER_POOL_FLEET),
  play: async ({ canvasElement }) => {
    const room = countLink(await atAGlance(canvasElement), "Room");

    await expect(room).toHaveTextContent("Room0across 2 worker pools");
    await expect(within(room).getByText("0")).toHaveClass("text-status-error");
    await expect(within(room).getByRole("img", { name: "No room" })).toBeVisible();
  },
};

export const SeveralAgentProfiles: Story = {
  decorators: withFleet(SEVERAL_AGENT_PROFILES_FLEET),
  play: async ({ canvasElement }) => {
    const profiles = group(await atAGlance(canvasElement), /^Agents by agent profile$/);
    const links = profiles.getAllByRole("link");

    await expect(links.map((link) => link.textContent)).toEqual([
      "go1",
      "java1",
      "node1",
      "python2",
      "No agent profile1",
    ]);
    await expect(countLink(profiles, "java")).toHaveAttribute("href", `${AGENT}/actors?agentProfile=java`);
    await expect(countLink(profiles, "No agent profile")).toHaveAttribute(
      "href",
      `${AGENT}/actors?agentProfile=__none__`
    );
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

    // Room comes from the workers, not from the WorkerPool list.
    await expect(countLink(await atAGlance(canvasElement), "Room")).toHaveTextContent("Room11across 2 worker pools");
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

export const CapacityOneWorkerPool: Story = {
  decorators: withFleet(ONE_WORKER_POOL_FLEET),
  play: async ({ canvasElement }) => {
    const section = await capacity(canvasElement);
    const card = workerPoolCard(section, "workers");

    await expect(section.getAllByRole("region")).toHaveLength(1);
    await expect(card.getByRole("link", { name: "workers" })).toHaveAttribute(
      "href",
      `${AGENT}/worker-pools#worker-pool/krci-agents/workers`
    );
    await expect(card.getByText("1 desired, 1 ready")).toBeVisible();
    await expect(card.getByText("Room for 1 agent")).toHaveClass("text-status-success");
    await expect(card.getByText("at 1.0 CPU, 2.0 Gi · limited by CPU and memory")).toBeVisible();
    for (const label of ["Actors", "CPU", "Memory"]) await expect(card.getByText(label)).toBeVisible();
    await expect(card.getAllByText("(0%)")).toHaveLength(3);
  },
};

export const CapacityFullWorkerPool: Story = {
  decorators: withFleet(ONE_FULL_WORKER_POOL_FLEET),
  play: async ({ canvasElement }) => {
    const full = workerPoolCard(await capacity(canvasElement), "workers-microvm");

    await expect(full.getByText("Full: the next agent waits")).toHaveClass("text-status-error");
    await expect(full.getByText("at 1.0 CPU, 2.0 Gi · limited by memory")).toBeVisible();
    await expect(full.getByText("(100%)")).toBeVisible();
    await expect(full.getByText("(50%)")).toBeVisible();
    await expect(full.getByText("(0%)")).toBeVisible();
  },
};

export const CapacityTwoWorkerPools: Story = {
  decorators: withFleet(HEALTHY_FLEET),
  play: async ({ canvasElement }) => {
    const section = await capacity(canvasElement);
    const cards = section.getAllByRole("region");

    await expect(cards).toHaveLength(2);
    await expect(cards[0]).toHaveAccessibleName("Worker pool krci-agents/workers");
    await expect(cards[1]).toHaveAccessibleName("Worker pool krci-agents/workers-microvm");
    const workers = workerPoolCard(section, "workers");
    await expect(workers.getByText("Room for 4 agents")).toBeVisible();
    await expect(workers.getByText("2 desired, 2 ready")).toBeVisible();
    await expect(workers.getByText("at 1.0 CPU, 2.0 Gi · limited by CPU and memory")).toBeVisible();
    const microvm = workerPoolCard(section, "workers-microvm");
    await expect(microvm.getByText("Room for 7 agents")).toBeVisible();
    await expect(microvm.getByText("at 1.0 CPU, 2.0 Gi · limited by memory")).toBeVisible();
  },
};

export const CapacityWorkerPoolNotReady: Story = {
  decorators: withFleet(NOT_READY_FLEET),
  play: async ({ canvasElement }) => {
    const section = await capacity(canvasElement);

    await expect(workerPoolCard(section, "workers").getByText("2 desired, 1 ready")).toHaveClass("text-status-error");
    const spare = workerPoolCard(section, "workers-spare");
    await expect(spare.getByText("No worker: the next agent waits")).toHaveClass("text-status-error");
    await expect(spare.getByText("at 1.0 CPU, 2.0 Gi · no active, registered worker")).toBeVisible();
  },
};

/** Verdict and bars come from the workers; replicas from the WorkerPool list. */
export const CapacityWorkerPoolsDenied: Story = {
  decorators: withFleet(WORKER_POOLS_DENIED_FLEET),
  play: async ({ canvasElement }) => {
    const section = await capacity(canvasElement);

    for (const [name, room] of [
      ["workers", 4],
      ["workers-microvm", 7],
    ] as const) {
      const card = workerPoolCard(section, name);
      await expect(card.getByText("no access")).toBeVisible();
      await expect(card.getByText(`Room for ${room} agents`)).toBeVisible();
      await expect(card.getByText("Memory")).toBeVisible();
    }
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

    const glance = await atAGlance(canvasElement);
    await expect(countLink(glance, "Workers")).toHaveTextContent("Workers31 draining");
    await expect(countLink(glance, "Room")).toHaveAttribute("href", `${AGENT}/worker-pools`);
    await expect(glance.queryByRole("link", { name: /^Agents/ })).toBeNull();
    await expect(glance.queryByRole("region", { name: "Actor state" })).toBeNull();
  },
};
