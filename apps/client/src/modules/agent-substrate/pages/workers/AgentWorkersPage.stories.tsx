import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { withAppProviders } from "@sb/index";
import {
  BUSY_WORKER,
  DRAINING_WORKER_FLEET,
  EMPTY_FLEET,
  FULL_WORKER_POOL_FLEET,
  MICROVM_WORKER,
  RUNNING_ACTOR,
  STORY_FLEET,
  UNREGISTERED_WORKER_FLEET,
  WORKER_POOLS_DENIED_FLEET,
  seedFleet,
} from "../../__fixtures__/storyFleet";
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
    await expect(workers.getByText(`${NAMESPACE} · room 4 (at 1.0 CPU, 2.0 Gi)`)).toBeVisible();
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
    await expect(microvm.getByText(`${NAMESPACE} · room 7 (at 1.0 CPU, 2.0 Gi)`)).toBeVisible();
    await expect(workerBlock(microvm, MICROVM_WORKER.pod).getByText("No actor on this worker")).toBeVisible();

    await expect(canvas.queryByText("No access to worker pools")).toBeNull();
  },
};

export const FullWorkerPool: Story = {
  decorators: [withAppProviders({ seedQueryCache: seedFleet(FULL_WORKER_POOL_FLEET) })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const workers = await workerPoolCard(canvas, "workers");
    await expect(workers.getByText(`${NAMESPACE} · room 0 (at 1.0 CPU, 2.0 Gi)`)).toBeVisible();
    await expect(workerBlock(workers, BUSY_WORKER.pod).getByText("1000 / 1000")).toBeVisible();
  },
};

export const DrainingWorker: Story = {
  decorators: [withAppProviders({ seedQueryCache: seedFleet(DRAINING_WORKER_FLEET) })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const workers = await workerPoolCard(canvas, "workers");
    await expect(workers.getByText(`${NAMESPACE} · room 1 (at 1.0 CPU, 2.0 Gi)`)).toBeVisible();
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
    await expect(microvm.getByText(`${NAMESPACE} · room 0 (at 1.0 CPU, 2.0 Gi)`)).toBeVisible();
    const block = workerBlock(microvm, MICROVM_WORKER.pod);
    await expect(block.getByText("not registered")).toBeVisible();
    await expect(block.getByText("active")).toBeVisible();
  },
};

export const WorkerPoolsDenied: Story = {
  decorators: [withAppProviders({ seedQueryCache: seedFleet(WORKER_POOLS_DENIED_FLEET) })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByText("No access to worker pools")).toBeVisible();
    const workers = await workerPoolCard(canvas, "workers");
    await expect(workers.getByText(`${NAMESPACE} · room 4 (at 1.0 CPU, 2.0 Gi)`)).toBeVisible();
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
