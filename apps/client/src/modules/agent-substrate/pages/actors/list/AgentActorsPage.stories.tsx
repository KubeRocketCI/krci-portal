import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { STORYBOOK_CLUSTER_NAME, withAppProviders } from "@sb/index";
import {
  CRASHED_ACTOR,
  EMPTY_FLEET,
  PLAIN_ACTOR,
  RUNNING_ACTOR,
  SEVERAL_AGENT_PROFILES_FLEET,
  STORY_FLEET,
  seedFleet,
} from "../../../__fixtures__/storyFleet";
import { PAGE_DESCRIPTION } from "../../../constants/hints";
import AgentActorsPage from "./page";

const meta = {
  title: "Modules/AgentSubstrate/AgentActorsPage",
  component: AgentActorsPage,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof AgentActorsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

type Canvas = ReturnType<typeof within>;

/** Not in meta: story-level decorators nest inside meta decorators. */
const WITH_STORY_FLEET = [withAppProviders({ seedQueryCache: seedFleet(STORY_FLEET) })];

const rowOf = (cell: HTMLElement) => within(cell.closest("tr")!);

const actorLinks = (canvas: Canvas) => canvas.getAllByRole("link", { name: /^issue-|^debug-/ });

async function pick(canvasElement: HTMLElement, label: string, option: string) {
  await userEvent.click(await within(canvasElement).findByRole("combobox", { name: label }));
  await userEvent.click(await within(canvasElement.ownerDocument.body).findByRole("option", { name: option }));
}

export const Ready: Story = {
  decorators: WITH_STORY_FLEET,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const running = rowOf(await canvas.findByRole("link", { name: RUNNING_ACTOR.name }));
    await expect(running.getByRole("link", { name: "krci/test-go-app#25" })).toHaveAttribute(
      "href",
      RUNNING_ACTOR.agent!.issue.url!
    );
    await expect(running.getByRole("link", { name: "test-go-app" })).toBeVisible();
    await expect(running.getByText("running")).toBeVisible();
    await expect(running.getByText("krci-agents/workers")).toBeVisible();
    await expect(running.queryByText("workers-7c9f6-0")).toBeNull();
    await expect(running.getByText("pending")).toBeVisible();
    const workerPoolHeader = within(canvas.getByRole("columnheader", { name: "Worker pool" }));
    await expect(workerPoolHeader.getByRole("button", { name: "Worker pool" })).toBeVisible();
    await expect(workerPoolHeader.getByRole("button", { name: "About Worker pool" })).toBeVisible();
    await expect(canvas.queryByRole("columnheader", { name: "Worker pod" })).toBeNull();
    await expect(canvas.getByText(PAGE_DESCRIPTION.actors)).toBeVisible();

    const unmatched = rowOf(canvas.getByRole("link", { name: "issue-5-3" }));
    await expect(unmatched.getByText("krci/test-python-app#3")).toBeVisible();
    await expect(unmatched.queryByRole("link", { name: "krci/test-python-app#3" })).toBeNull();
    await expect(unmatched.getByText("krci/test-python-app")).toBeVisible();

    const plain = rowOf(canvas.getByRole("link", { name: PLAIN_ACTOR.name }));
    await expect(plain.getByText("unknown")).toBeVisible();
    // Dash columns: issue, Codebase, agent profile, model, worker pool, node, snapshot.
    await expect(plain.getAllByText("—")).toHaveLength(7);

    await expect(actorLinks(canvas)).toHaveLength(STORY_FLEET.actors.length);
  },
};

/** Worker pod is hidden by default; the Columns menu shows it after Worker pool. Hidden again at the end. */
export const WorkerPodColumn: Story = {
  decorators: WITH_STORY_FLEET,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const toggleWorkerPod = async () => {
      await userEvent.click(canvas.getByRole("button", { name: /^Columns/ }));
      await userEvent.click(await body.findByRole("menuitemcheckbox", { name: "Worker pod" }));
      await userEvent.keyboard("{Escape}");
    };

    await canvas.findByRole("link", { name: RUNNING_ACTOR.name });
    await expect(canvas.queryByRole("columnheader", { name: "Worker pod" })).toBeNull();

    await userEvent.click(canvas.getByRole("button", { name: /^Columns/ }));
    await expect(await body.findByRole("menuitemcheckbox", { name: "Worker pod" })).not.toBeChecked();
    await userEvent.keyboard("{Escape}");

    await toggleWorkerPod();
    const headers = canvas.getAllByRole("columnheader").map((header) => header.textContent);
    await expect(headers.indexOf("Worker pod")).toBe(headers.indexOf("Worker pool") + 1);
    const running = rowOf(canvas.getByRole("link", { name: RUNNING_ACTOR.name }));
    await expect(running.getByText(RUNNING_ACTOR.placement!.workerPod)).toBeVisible();

    await toggleWorkerPod();
    await waitFor(() => expect(canvas.queryByRole("columnheader", { name: "Worker pod" })).toBeNull());
  },
};

export const Filtered: Story = {
  decorators: WITH_STORY_FLEET,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await pick(canvasElement, "Actor state", "Crashed");

    await waitFor(() => expect(canvas.queryByRole("link", { name: RUNNING_ACTOR.name })).toBeNull());
    await expect(canvas.getByRole("link", { name: CRASHED_ACTOR.name })).toBeVisible();
    await expect(actorLinks(canvas)).toHaveLength(1);
    await expect(canvas.getByRole("button", { name: "Clear" })).toBeVisible();
  },
};

export const FilteredByAtespace: Story = {
  decorators: WITH_STORY_FLEET,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await pick(canvasElement, "Atespace", PLAIN_ACTOR.atespace);

    await waitFor(() => expect(canvas.queryByRole("link", { name: RUNNING_ACTOR.name })).toBeNull());
    await expect(actorLinks(canvas)).toHaveLength(1);
    await expect(canvas.getByRole("link", { name: PLAIN_ACTOR.name })).toBeVisible();
  },
};

export const FilteredByCodebase: Story = {
  decorators: WITH_STORY_FLEET,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(await canvas.findByRole("combobox", { name: "Codebase" }));
    await expect(await body.findByRole("option", { name: "test-go-app" })).toBeVisible();
    await userEvent.click(body.getByRole("option", { name: "test-python-app" }));

    await waitFor(() => expect(canvas.queryByRole("link", { name: RUNNING_ACTOR.name })).toBeNull());
    await expect(actorLinks(canvas)).toHaveLength(1);
    await expect(canvas.getByRole("link", { name: CRASHED_ACTOR.name })).toBeVisible();
  },
};

export const FilteredByWorkerPool: Story = {
  decorators: WITH_STORY_FLEET,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(await canvas.findByRole("combobox", { name: "Worker pool" }));
    await expect(await body.findByRole("option", { name: "krci-agents/workers-microvm" })).toBeVisible();
    await userEvent.click(body.getByRole("option", { name: "krci-agents/workers" }));

    await waitFor(() => expect(canvas.queryByRole("link", { name: CRASHED_ACTOR.name })).toBeNull());
    await expect(actorLinks(canvas).map((link: HTMLElement) => link.textContent)).toEqual([RUNNING_ACTOR.name]);
    await expect(canvas.getByRole("button", { name: "Clear" })).toBeVisible();
  },
};

export const FilteredByWorkerPoolFromUrl: Story = {
  decorators: [
    withAppProviders({
      seedQueryCache: seedFleet(STORY_FLEET),
      initialUrl: `/c/${STORYBOOK_CLUSTER_NAME}/agent/actors?workerPool=krci-agents%2Fworkers-microvm`,
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByRole("combobox", { name: "Worker pool" })).toHaveTextContent(
      "krci-agents/workers-microvm"
    );
    // No actor runs on a worker of workers-microvm.
    await expect(await canvas.findByText("No results found!")).toBeVisible();
  },
};

export const FilteredByAgentProfile: Story = {
  decorators: [withAppProviders({ seedQueryCache: seedFleet(SEVERAL_AGENT_PROFILES_FLEET) })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await pick(canvasElement, "Agent profile", "No agent profile");

    await waitFor(() => expect(canvas.queryByRole("link", { name: RUNNING_ACTOR.name })).toBeNull());
    await expect(actorLinks(canvas).map((link: HTMLElement) => link.textContent)).toEqual(["issue-2-26"]);
  },
};

/** The URL that an agent profile count of the Overview opens. */
export const FilteredByAgentProfileFromUrl: Story = {
  decorators: [
    withAppProviders({
      seedQueryCache: seedFleet(SEVERAL_AGENT_PROFILES_FLEET),
      initialUrl: `/c/${STORYBOOK_CLUSTER_NAME}/agent/actors?agentProfile=python`,
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByRole("combobox", { name: "Agent profile" })).toHaveTextContent("python");
    await waitFor(() => expect(canvas.queryByRole("link", { name: RUNNING_ACTOR.name })).toBeNull());
    await expect(actorLinks(canvas).map((link: HTMLElement) => link.textContent)).toEqual(["issue-5-3", "issue-5-4"]);
  },
};

/** A hand-typed URL: the router parses `007` to the number 7. */
export const FilteredByNumericAgentProfileFromUrl: Story = {
  decorators: [
    withAppProviders({
      seedQueryCache: seedFleet(
        (() => {
          const fleet = structuredClone(SEVERAL_AGENT_PROFILES_FLEET);
          fleet.actors.find(({ name }) => name === "issue-6-3")!.agent!.agentProfile = "007";
          fleet.summary.agentsByProfile = fleet.summary.agentsByProfile.map((count) =>
            count.agentProfile === "java" ? { ...count, agentProfile: "007" } : count
          );
          return fleet;
        })()
      ),
      initialUrl: `/c/${STORYBOOK_CLUSTER_NAME}/agent/actors?agentProfile=007`,
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByRole("combobox", { name: "Agent profile" })).toHaveTextContent("007");
    await waitFor(() => expect(canvas.queryByRole("link", { name: RUNNING_ACTOR.name })).toBeNull());
    await expect(actorLinks(canvas).map((link: HTMLElement) => link.textContent)).toEqual(["issue-6-3"]);
  },
};

/** The URL that an actor state count of the Overview opens. */
export const FilteredByActorStateFromUrl: Story = {
  decorators: [
    withAppProviders({
      seedQueryCache: seedFleet(STORY_FLEET),
      initialUrl: `/c/${STORYBOOK_CLUSTER_NAME}/agent/actors?actorState=crashed`,
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByRole("combobox", { name: "Actor state" })).toHaveTextContent("Crashed");
    await waitFor(() => expect(canvas.queryByRole("link", { name: RUNNING_ACTOR.name })).toBeNull());
    await expect(actorLinks(canvas).map((link: HTMLElement) => link.textContent)).toEqual([CRASHED_ACTOR.name]);
  },
};

export const Empty: Story = {
  decorators: [
    withAppProviders({
      seedQueryCache: seedFleet({ ...EMPTY_FLEET, atespaces: STORY_FLEET.atespaces }),
    }),
  ],
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("No actors")).toBeVisible();
  },
};

export const NoAtespaces: Story = {
  decorators: [withAppProviders({ seedQueryCache: seedFleet(EMPTY_FLEET) })],
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("Agent Substrate has no atespaces yet")).toBeVisible();
  },
};
