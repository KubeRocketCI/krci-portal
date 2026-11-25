import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { STORYBOOK_CLUSTER_NAME, withAppProviders } from "@sb/index";
import { LOCAL_STORAGE_SERVICE } from "@/core/services/local-storage";
import { VIEW_MODES, viewModeStorageKey, type ViewMode } from "@/core/providers/ViewMode/types";
import {
  BUSY_WORKER,
  DRAINING_WORKER_FLEET,
  EMPTY_FLEET,
  FULL_WORKER_POOL_FLEET,
  MICROVM_WORKER,
  NOT_READY_FLEET,
  ROOM_STATES_FLEET,
  RUNNING_ACTOR,
  STORY_FLEET,
  UNREGISTERED_WORKER_FLEET,
  WORKER_POOLS_DENIED_FLEET,
  WORKER_POOLS_ERROR_FLEET,
  seedFleet,
} from "../../__fixtures__/storyFleet";
import { PAGE_DESCRIPTION } from "../../constants/hints";
import { workerAnchor, workerPoolAnchor } from "../../utils/rowAnchor";
import { WORKER_POOLS_VIEW_ENTITY_ID } from "./constants";
import FactoryWorkerPoolsPage from "./page";

const VIEW_MODE_KEY = viewModeStorageKey(WORKER_POOLS_VIEW_ENTITY_ID);

const NAMESPACE = BUSY_WORKER.workerNamespace;

/** Verdicts and room sizes of ROOM_STATES_FLEET; the cards and the table show the same. */
const ROOM_STATE_VERDICTS = [
  ["workers", "Room for 3 actors", "text-status-success", "1.0 CPU, 2.0 Gi"],
  ["workers-busy", "Full", "text-status-missing", "1.0 CPU, 2.0 Gi"],
  ["workers-small", "Too small for the room size", "text-status-missing", "1.0 CPU, 2.0 Gi"],
  ["workers-spare", "No active, registered worker", "text-status-missing", "—"],
  ["workers-unused", "No actor template selects this worker pool", "text-muted-foreground", "—"],
  ["workers-zero", "No actor capacity", "text-status-missing", "By actor count"],
] as const;

/** The value of a term in a card: the `dd` after its `dt`. */
const fact = (scope: Canvas, term: string) => scope.getByText(term, { selector: "dt" }).nextElementSibling;

const PAGE_URL = `/c/${STORYBOOK_CLUSTER_NAME}/factory/worker-pools`;

const savedView = (viewMode: ViewMode | null) => () => {
  if (viewMode === null) LOCAL_STORAGE_SERVICE.removeItem(VIEW_MODE_KEY);
  else LOCAL_STORAGE_SERVICE.setItem(VIEW_MODE_KEY, viewMode);
};

const meta = {
  title: "Modules/AgentSubstrate/FactoryWorkerPoolsPage",
  component: FactoryWorkerPoolsPage,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  beforeEach: savedView(null),
} satisfies Meta<typeof FactoryWorkerPoolsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

type Canvas = ReturnType<typeof within>;

async function workerPoolCard(canvas: Canvas, name: string) {
  return within(await canvas.findByRole("region", { name: `Worker pool ${NAMESPACE}/${name}` }));
}

const workerBlock = (workerPool: Canvas, pod: string) =>
  within(workerPool.getByRole("region", { name: `Worker ${pod}` }));

async function rowOf(canvasElement: HTMLElement, name: string) {
  const cell = await within(canvasElement).findByText(name, { selector: "td *" });
  return within(cell.closest("tr")!);
}

const viewButton = (canvas: Canvas, name: "Cards" | "Table") => canvas.getByRole("button", { name });

export const Ready: Story = {
  decorators: [withAppProviders({ seedQueryCache: seedFleet(STORY_FLEET) })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const workers = await workerPoolCard(canvas, "workers");
    await expect(viewButton(canvas, "Cards")).toHaveAttribute("aria-pressed", "true");
    await expect(viewButton(canvas, "Table")).toHaveAttribute("aria-pressed", "false");

    await expect(canvas.getByText(PAGE_DESCRIPTION.workerPools)).toBeVisible();
    await expect(workers.getByText("Room for 4 actors")).toHaveClass("text-status-success");
    await expect(fact(workers, "Room size")).toHaveTextContent("1.0 CPU, 2.0 Gi");
    await expect(fact(workers, "Limited by")).toHaveTextContent("CPU and memory");
    await expect(fact(workers, "Worker labels")).toHaveTextContent("workload=workers");
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
    await expect(microvm.getByText("Room for 7 actors")).toBeVisible();
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
    await expect(workers.getByText("Room for 1 actor")).toBeVisible();
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

export const RoomStates: Story = {
  decorators: [withAppProviders({ seedQueryCache: seedFleet(ROOM_STATES_FLEET) })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    for (const [name, text, tone, roomSize] of ROOM_STATE_VERDICTS) {
      const card = await workerPoolCard(canvas, name);
      await expect(card.getByText(text)).toHaveClass(tone);
      await expect(fact(card, "Room size")).toHaveTextContent(roomSize);
    }
    await expect(canvas.queryByText(/no actor template limits/i)).toBeNull();
    await expect(fact(await workerPoolCard(canvas, "workers-unused"), "Worker labels")).toHaveTextContent(
      "workload=unused"
    );
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
    await expect(workers.getByText("Room for 4 actors")).toBeVisible();
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
    await expect(await within(canvasElement).findByText("No worker pools")).toBeVisible();
  },
};

export const WorkersWithoutAtespaces: Story = {
  decorators: [withAppProviders({ seedQueryCache: seedFleet({ ...STORY_FLEET, atespaces: [], actors: [] }) })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const workers = await workerPoolCard(canvas, "workers");
    await expect(workerBlock(workers, BUSY_WORKER.pod).getByText("No actor on this worker")).toBeVisible();
    await expect(canvas.queryByText("Factory has no atespaces yet")).toBeNull();
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
    await expect(canvas.getByText("No worker pools")).toBeVisible();
  },
};

export const NoAtespaces: Story = {
  decorators: [withAppProviders({ seedQueryCache: seedFleet(EMPTY_FLEET) })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByText("Factory has no atespaces yet")).toBeVisible();
    await expect(canvas.queryByRole("group", { name: "View" })).toBeNull();
  },
};

export const TableReady: Story = {
  beforeEach: savedView(VIEW_MODES.TABLE),
  decorators: [withAppProviders({ seedQueryCache: seedFleet(STORY_FLEET) })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const workers = await rowOf(canvasElement, "workers");
    await expect(viewButton(canvas, "Table")).toHaveAttribute("aria-pressed", "true");
    await expect(workers.getByText("2/2 ready")).toBeVisible();
    await expect(workers.getByText("gvisor")).toBeVisible();
    await expect(workers.getByText("Resolved")).toBeVisible();
    await expect(workers.getByText("4")).toBeVisible();
    await expect(workers.getByText("Room for 4 actors")).toHaveClass("text-status-success");

    const microvm = await rowOf(canvasElement, "workers-microvm");
    await expect(microvm.getByText("microvm")).toBeVisible();
    await expect(microvm.getByText("7")).toBeVisible();

    await expect(canvas.queryByRole("region", { name: /^Worker pool / })).toBeNull();
    await expect(canvas.queryByRole("alert")).toBeNull();
  },
};

export const TableRoomStates: Story = {
  beforeEach: savedView(VIEW_MODES.TABLE),
  decorators: [withAppProviders({ seedQueryCache: seedFleet(ROOM_STATES_FLEET) })],
  play: async ({ canvasElement }) => {
    for (const [name, text, tone, roomSize] of ROOM_STATE_VERDICTS) {
      const row = await rowOf(canvasElement, name);
      await expect(row.getByText(text)).toHaveClass(tone);
      // The room next to the verdict.
      await expect(row.getByText(text).closest("td")).toHaveTextContent(name === "workers" ? `3${text}` : `0${text}`);
      await expect(row.getAllByText(roomSize).length).toBeGreaterThan(0);
    }
    await expect((await rowOf(canvasElement, "workers-unused")).getByText("workload=unused")).toBeVisible();
  },
};

export const TableNotReady: Story = {
  beforeEach: savedView(VIEW_MODES.TABLE),
  decorators: [withAppProviders({ seedQueryCache: seedFleet(NOT_READY_FLEET) })],
  play: async ({ canvasElement }) => {
    await expect((await rowOf(canvasElement, "workers")).getByText("1/2 ready")).toBeVisible();

    const spare = await rowOf(canvasElement, "workers-spare");
    await expect(spare.getByText("0/2 ready")).toBeVisible();
    // Resolution not reported yet; no worker: no worker labels, no room size.
    await expect(spare.getAllByText("—")).toHaveLength(3);
  },
};

export const TableWorkerPoolsDenied: Story = {
  beforeEach: savedView(VIEW_MODES.TABLE),
  decorators: [withAppProviders({ seedQueryCache: seedFleet(WORKER_POOLS_DENIED_FLEET) })],
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("No access to worker pools")).toBeVisible();

    const workers = await rowOf(canvasElement, "workers");
    // Ready, desired, sandbox class, resolution.
    await expect(workers.getAllByText("—")).toHaveLength(4);
    await expect(workers.getByText("4")).toBeVisible();
  },
};

export const TableWorkerPoolsError: Story = {
  beforeEach: savedView(VIEW_MODES.TABLE),
  decorators: [withAppProviders({ seedQueryCache: seedFleet(WORKER_POOLS_ERROR_FLEET) })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByText("Worker pools cannot be read")).toBeVisible();
    await expect(canvas.getByText(/See the portal server logs for the error\./)).toBeVisible();
    await expect((await rowOf(canvasElement, "workers")).getAllByText("—")).toHaveLength(4);
  },
};

export const SwitchesView: Story = {
  decorators: [withAppProviders({ seedQueryCache: seedFleet(STORY_FLEET) })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await workerPoolCard(canvas, "workers");

    await userEvent.click(viewButton(canvas, "Table"));
    await rowOf(canvasElement, "workers");
    await expect(canvas.queryByRole("region", { name: `Worker pool ${NAMESPACE}/workers` })).toBeNull();
    await expect(LOCAL_STORAGE_SERVICE.getItem(VIEW_MODE_KEY)).toBe(VIEW_MODES.TABLE);

    await userEvent.click(viewButton(canvas, "Cards"));
    await workerPoolCard(canvas, "workers");
    await expect(LOCAL_STORAGE_SERVICE.getItem(VIEW_MODE_KEY)).toBe(VIEW_MODES.GRID);
  },
};

/** The Needs attention link of a worker opens this URL: cards, also when the table is saved. */
export const LandsOnWorker: Story = {
  beforeEach: savedView(VIEW_MODES.TABLE),
  decorators: [
    withAppProviders({
      seedQueryCache: seedFleet(DRAINING_WORKER_FLEET),
      initialUrl: `${PAGE_URL}#${workerAnchor(BUSY_WORKER)}`,
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const workers = await workerPoolCard(canvas, "workers");

    const target = workers.getByRole("region", { name: `Worker ${BUSY_WORKER.pod}` });
    await expect(target).toHaveAttribute("id", workerAnchor(BUSY_WORKER));
    await expect(target).toHaveAttribute("aria-current", "true");
    await expect(workers.getByRole("region", { name: `Worker ${STORY_FLEET.workers[0].pod}` })).not.toHaveAttribute(
      "aria-current"
    );
    await expect(viewButton(canvas, "Cards")).toHaveAttribute("aria-pressed", "true");
    await expect(LOCAL_STORAGE_SERVICE.getItem(VIEW_MODE_KEY)).toBe(VIEW_MODES.TABLE);
  },
};

export const LeavesWorkerForTable: Story = {
  beforeEach: savedView(VIEW_MODES.TABLE),
  decorators: [
    withAppProviders({
      seedQueryCache: seedFleet(DRAINING_WORKER_FLEET),
      initialUrl: `${PAGE_URL}#${workerAnchor(BUSY_WORKER)}`,
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await workerPoolCard(canvas, "workers");

    await userEvent.click(viewButton(canvas, "Table"));

    await rowOf(canvasElement, "workers");
    await waitFor(() => expect(viewButton(canvas, "Table")).toHaveAttribute("aria-pressed", "true"));
  },
};

/** The pressed Cards button on a worker link saves the cards. */
export const KeepsCardsFromWorker: Story = {
  beforeEach: savedView(VIEW_MODES.TABLE),
  decorators: [
    withAppProviders({
      seedQueryCache: seedFleet(DRAINING_WORKER_FLEET),
      initialUrl: `${PAGE_URL}#${workerAnchor(BUSY_WORKER)}`,
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await workerPoolCard(canvas, "workers");

    await userEvent.click(viewButton(canvas, "Cards"));

    await expect(LOCAL_STORAGE_SERVICE.getItem(VIEW_MODE_KEY)).toBe(VIEW_MODES.GRID);
    await workerPoolCard(canvas, "workers");
  },
};

/** The Workers card and the Needs attention Show all of workers open this URL: cards, the saved table kept. */
export const AsksForCards: Story = {
  beforeEach: savedView(VIEW_MODES.TABLE),
  decorators: [
    withAppProviders({
      seedQueryCache: seedFleet(DRAINING_WORKER_FLEET),
      initialUrl: `${PAGE_URL}?view=${VIEW_MODES.GRID}`,
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await workerPoolCard(canvas, "workers");
    await expect(viewButton(canvas, "Cards")).toHaveAttribute("aria-pressed", "true");
    await expect(LOCAL_STORAGE_SERVICE.getItem(VIEW_MODE_KEY)).toBe(VIEW_MODES.TABLE);

    await userEvent.click(viewButton(canvas, "Table"));
    await rowOf(canvasElement, "workers");
    await expect(LOCAL_STORAGE_SERVICE.getItem(VIEW_MODE_KEY)).toBe(VIEW_MODES.TABLE);
  },
};

/** The Needs attention and Capacity links of a worker pool open this URL: its card is highlighted. */
export const LandsOnWorkerPoolCard: Story = {
  decorators: [
    withAppProviders({
      seedQueryCache: seedFleet(NOT_READY_FLEET),
      initialUrl: `${PAGE_URL}#${workerPoolAnchor({ namespace: NAMESPACE, name: "workers-spare" })}`,
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await workerPoolCard(canvas, "workers-spare");

    const card = canvas.getByRole("region", { name: `Worker pool ${NAMESPACE}/workers-spare` });
    await expect(card).toHaveAttribute("id", `worker-pool/${NAMESPACE}/workers-spare`);
    await expect(card).toHaveAttribute("aria-current", "true");
    await expect(canvas.getByRole("region", { name: `Worker pool ${NAMESPACE}/workers` })).not.toHaveAttribute(
      "aria-current"
    );
  },
};

export const LandsOnWorkerPoolRow: Story = {
  beforeEach: savedView(VIEW_MODES.TABLE),
  decorators: [
    withAppProviders({
      seedQueryCache: seedFleet(NOT_READY_FLEET),
      initialUrl: `${PAGE_URL}#${workerPoolAnchor({ namespace: NAMESPACE, name: "workers-spare" })}`,
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
