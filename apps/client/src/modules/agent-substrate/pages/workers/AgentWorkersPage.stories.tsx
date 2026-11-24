import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { STORYBOOK_CLUSTER_NAME, withAppProviders } from "@sb/index";
import {
  BUSY_WORKER,
  DRAINING_WORKER_FLEET,
  EMPTY_FLEET,
  FULL_WORKER_POOL_FLEET,
  MICROVM_WORKER,
  ROOM_STATES_FLEET,
  RUNNING_ACTOR,
  STORY_FLEET,
  UNREGISTERED_WORKER_FLEET,
  WORKER_POOLS_DENIED_FLEET,
  seedFleet,
} from "../../__fixtures__/storyFleet";
import { workerAnchor } from "../../utils/rowAnchor";
import AgentWorkersPage from "./page";

const meta = {
  title: "Modules/AgentSubstrate/AgentWorkersPage",
  component: AgentWorkersPage,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof AgentWorkersPage>;

export default meta;
type Story = StoryObj<typeof meta>;

type Canvas = ReturnType<typeof within>;

const NAMESPACE = BUSY_WORKER.workerNamespace;

async function workerPoolCard(canvas: Canvas, name: string) {
  return within(await canvas.findByRole("region", { name: `Worker pool ${NAMESPACE}/${name}` }));
}

const workerBlock = (pool: Canvas, pod: string) => within(pool.getByRole("region", { name: `Worker ${pod}` }));

export const Ready: Story = {
  decorators: [withAppProviders({ seedQueryCache: seedFleet(STORY_FLEET) })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const workers = await workerPoolCard(canvas, "workers");
    await expect(workers.getByText("Room for 4 agents")).toHaveClass("text-status-success");
    await expect(workers.getByText("at 1.0 CPU, 2.0 Gi · limited by CPU and memory")).toBeVisible();
    await expect(workers.getByText("2/2 ready")).toBeVisible();
    await expect(workers.getByText("gvisor")).toBeVisible();

    const busy = workerBlock(workers, BUSY_WORKER.pod);
    await expect(busy.getByRole("link", { name: RUNNING_ACTOR.name })).toBeVisible();
    await expect(busy.getByText("running")).toBeVisible();
    await expect(busy.getByText("active")).toBeVisible();
    await expect(busy.getByText("1.0 / 4.0")).toBeVisible();
    await expect(busy.getByText("2.0 Gi / 8.0 Gi")).toBeVisible();

    const idle = workerBlock(workers, STORY_FLEET.workers[0].pod);
    await expect(idle.getByText("No actor on this worker")).toBeVisible();

    const microvm = await workerPoolCard(canvas, "workers-microvm");
    await expect(microvm.getByText("Room for 7 agents")).toBeVisible();
    await expect(workerBlock(microvm, MICROVM_WORKER.pod).getByText("No actor on this worker")).toBeVisible();

    await expect(canvas.queryByText("No access to worker pools")).toBeNull();
  },
};

export const FullWorkerPool: Story = {
  decorators: [withAppProviders({ seedQueryCache: seedFleet(FULL_WORKER_POOL_FLEET) })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const workers = await workerPoolCard(canvas, "workers");
    await expect(workers.getByText("Full: no room in the fleet")).toHaveClass("text-status-error");
    await expect(workerBlock(workers, BUSY_WORKER.pod).getByText("1000 / 1000")).toBeVisible();
  },
};

export const DrainingWorker: Story = {
  decorators: [withAppProviders({ seedQueryCache: seedFleet(DRAINING_WORKER_FLEET) })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const workers = await workerPoolCard(canvas, "workers");
    await expect(workers.getByText("Room for 1 agent")).toBeVisible();
    const busy = workerBlock(workers, BUSY_WORKER.pod);
    await expect(busy.getByText("draining")).toBeVisible();
    await expect(busy.getByRole("link", { name: RUNNING_ACTOR.name })).toBeVisible();
  },
};

export const UnregisteredWorker: Story = {
  decorators: [withAppProviders({ seedQueryCache: seedFleet(UNREGISTERED_WORKER_FLEET) })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const microvm = await workerPoolCard(canvas, "workers-microvm");
    await expect(microvm.getByText("No active, registered worker")).toHaveClass("text-status-missing");
    const block = workerBlock(microvm, MICROVM_WORKER.pod);
    await expect(block.getByText("not registered")).toBeVisible();
    await expect(block.getByText("active")).toBeVisible();
  },
};

/** Same verdicts as the Overview Capacity cards. */
export const RoomStates: Story = {
  decorators: [withAppProviders({ seedQueryCache: seedFleet(ROOM_STATES_FLEET) })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    for (const [name, text, tone] of [
      ["workers", "Room for 3 agents", "text-status-success"],
      ["workers-busy", "Full", "text-status-missing"],
      ["workers-small", "Too small for the room size", "text-status-missing"],
      ["workers-spare", "No active, registered worker", "text-status-missing"],
    ] as const) {
      await expect((await workerPoolCard(canvas, name)).getByText(text)).toHaveClass(tone);
    }
    const busy = await workerPoolCard(canvas, "workers-busy");
    await expect(busy.getByRole("link", { name: "issue-7-2" })).toBeVisible();
    await expect(busy.getByRole("link", { name: "issue-7-3" })).toBeVisible();
    await expect(
      (await workerPoolCard(canvas, "workers-spare")).getByText("No worker in this worker pool")
    ).toBeVisible();
  },
};

export const WorkerPoolsDenied: Story = {
  decorators: [withAppProviders({ seedQueryCache: seedFleet(WORKER_POOLS_DENIED_FLEET) })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByText("No access to worker pools")).toBeVisible();
    const workers = await workerPoolCard(canvas, "workers");
    await expect(workers.getByText("Room for 4 agents")).toBeVisible();
    await expect(workers.getByText("WorkerPool not readable")).toBeVisible();
    await expect(workers.queryByText("2/2 ready")).toBeNull();
  },
};

export const Empty: Story = {
  decorators: [
    withAppProviders({
      seedQueryCache: seedFleet({ ...EMPTY_FLEET, atespaces: STORY_FLEET.atespaces }),
    }),
  ],
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("No workers")).toBeVisible();
  },
};

export const WorkersWithoutAtespaces: Story = {
  decorators: [withAppProviders({ seedQueryCache: seedFleet({ ...STORY_FLEET, atespaces: [], actors: [] }) })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const workers = await workerPoolCard(canvas, "workers");
    await expect(workerBlock(workers, BUSY_WORKER.pod).getByText("No actor on this worker")).toBeVisible();
    await expect(canvas.queryByText("Agent Substrate has no atespaces yet")).toBeNull();
  },
};

export const NoWorkersWorkerPoolsDenied: Story = {
  decorators: [
    withAppProviders({
      seedQueryCache: seedFleet({ ...EMPTY_FLEET, workerPools: { ...EMPTY_FLEET.workerPools, access: "denied" } }),
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByText("No access to worker pools")).toBeVisible();
    await expect(canvas.getByText("No workers")).toBeVisible();
  },
};

export const NoAtespaces: Story = {
  decorators: [withAppProviders({ seedQueryCache: seedFleet(EMPTY_FLEET) })],
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("Agent Substrate has no atespaces yet")).toBeVisible();
  },
};

/** The Needs attention link of a worker opens this URL. */
export const LandsOnWorker: Story = {
  decorators: [
    withAppProviders({
      seedQueryCache: seedFleet(DRAINING_WORKER_FLEET),
      initialUrl: `/c/${STORYBOOK_CLUSTER_NAME}/agent/workers#${workerAnchor(BUSY_WORKER)}`,
    }),
  ],
  play: async ({ canvasElement }) => {
    const workers = await workerPoolCard(within(canvasElement), "workers");

    const target = workers.getByRole("region", { name: `Worker ${BUSY_WORKER.pod}` });
    await expect(target).toHaveAttribute("id", workerAnchor(BUSY_WORKER));
    await expect(target).toHaveAttribute("aria-current", "true");
    await expect(workers.getByRole("region", { name: `Worker ${STORY_FLEET.workers[0].pod}` })).not.toHaveAttribute(
      "aria-current"
    );
  },
};
