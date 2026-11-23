import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { STORYBOOK_CLUSTER_NAME, withAppProviders } from "@sb/index";
import {
  NOT_READY_FLEET,
  STORY_FLEET,
  WORKER_POOLS_DENIED_FLEET,
  WORKER_POOLS_ERROR_FLEET,
  seedFleet,
} from "../../__fixtures__/storyFleet";
import { workerPoolAnchor } from "../../utils/rowAnchor";
import AgentWorkerPoolsPage from "./page";

const NAMESPACE = NOT_READY_FLEET.workerPools.items[0].namespace;

const meta = {
  title: "Modules/AgentSubstrate/AgentWorkerPoolsPage",
  component: AgentWorkerPoolsPage,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof AgentWorkerPoolsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

async function rowOf(canvasElement: HTMLElement, name: string) {
  const cell = await within(canvasElement).findByText(name, { selector: "td *" });
  return within(cell.closest("tr")!);
}

export const Ready: Story = {
  decorators: [withAppProviders({ seedQueryCache: seedFleet(STORY_FLEET) })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const workers = await rowOf(canvasElement, "workers");
    await expect(workers.getByText("2/2 ready")).toBeVisible();
    await expect(workers.getByText("gvisor")).toBeVisible();
    await expect(workers.getByText("Resolved")).toBeVisible();
    await expect(workers.getByText("4")).toBeVisible();

    const microvm = await rowOf(canvasElement, "workers-microvm");
    await expect(microvm.getByText("microvm")).toBeVisible();
    await expect(microvm.getByText("7")).toBeVisible();

    await expect(canvas.getByText("Room is counted at 1.0 CPU, 2.0 Gi.")).toBeVisible();
    await expect(canvas.queryByRole("alert")).toBeNull();
  },
};

export const NotReady: Story = {
  decorators: [withAppProviders({ seedQueryCache: seedFleet(NOT_READY_FLEET) })],
  play: async ({ canvasElement }) => {
    await expect((await rowOf(canvasElement, "workers")).getByText("1/2 ready")).toBeVisible();

    const spare = await rowOf(canvasElement, "workers-spare");
    await expect(spare.getByText("0/2 ready")).toBeVisible();
    // Resolution not reported yet.
    await expect(spare.getAllByText("—")).toHaveLength(1);
  },
};

export const WorkerPoolsDenied: Story = {
  decorators: [withAppProviders({ seedQueryCache: seedFleet(WORKER_POOLS_DENIED_FLEET) })],
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("No access to worker pools")).toBeVisible();

    const workers = await rowOf(canvasElement, "workers");
    // Ready, desired, sandbox class, resolution.
    await expect(workers.getAllByText("—")).toHaveLength(4);
    await expect(workers.getByText("4")).toBeVisible();
  },
};

export const WorkerPoolsError: Story = {
  decorators: [withAppProviders({ seedQueryCache: seedFleet(WORKER_POOLS_ERROR_FLEET) })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByText("Worker pools cannot be read")).toBeVisible();
    await expect(canvas.getByText(/See the portal server logs for the error\./)).toBeVisible();
    await expect((await rowOf(canvasElement, "workers")).getAllByText("—")).toHaveLength(4);
  },
};

/** The Needs attention link of a worker pool opens this URL: its row is first and highlighted. */
export const LandsOnWorkerPool: Story = {
  decorators: [
    withAppProviders({
      seedQueryCache: seedFleet(NOT_READY_FLEET),
      initialUrl: `/c/${STORYBOOK_CLUSTER_NAME}/agent/worker-pools#${workerPoolAnchor({ namespace: NAMESPACE, name: "workers-spare" })}`,
    }),
  ],
  play: async ({ canvasElement }) => {
    const cell = await within(canvasElement).findByText("workers-spare", { selector: "td *" });
    const row = cell.closest("tr")!;

    await expect(row).toHaveAttribute("id", `worker-pool/${NAMESPACE}/workers-spare`);
    await expect(row).toHaveAttribute("aria-current", "true");
    await expect(row.parentElement!.querySelector("tr")).toBe(row);
    await expect((await rowOf(canvasElement, "workers")).getByText("1/2 ready").closest("tr")).not.toHaveAttribute(
      "aria-current"
    );
  },
};
