import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { STORYBOOK_CLUSTER_NAME, withAppProviders } from "@sb/index";
import { VIEW_MODES, viewModeStorageKey, type ViewMode } from "@/core/providers/ViewMode/types";
import { LOCAL_STORAGE_SERVICE } from "@/core/services/local-storage";
import type { FleetData } from "../../../hooks/useFleet";
import {
  CRASHED_ACTOR,
  EMPTY_FLEET,
  PLAIN_ACTOR,
  RUNNING_ACTOR,
  SEVERAL_AGENT_PROFILES_FLEET,
  STORY_FLEET,
  seedFleet,
} from "../../../__fixtures__/storyFleet";
import { WithLocation } from "../../../__fixtures__/storyLocation";
import { PAGE_DESCRIPTION } from "../../../constants/hints";
import { AGENTS_VIEW_ENTITY_ID } from "./constants";
import FactoryAgentsPage from "./page";

const VIEW_MODE_KEY = viewModeStorageKey(AGENTS_VIEW_ENTITY_ID);

const clearSavedView = () => LOCAL_STORAGE_SERVICE.removeItem(VIEW_MODE_KEY);

/** The cleanup clears the view that the story or its toggle clicks saved. */
const savedView = (viewMode: ViewMode | null) => () => {
  if (viewMode === null) clearSavedView();
  else LOCAL_STORAGE_SERVICE.setItem(VIEW_MODE_KEY, viewMode);
  return clearSavedView;
};

const meta = {
  title: "Modules/AgentSubstrate/FactoryAgentsPage",
  component: FactoryAgentsPage,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  beforeEach: savedView(null),
} satisfies Meta<typeof FactoryAgentsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

type Canvas = ReturnType<typeof within>;

const withFleet = (fleet: FleetData, initialUrl?: string) => [
  withAppProviders({ seedQueryCache: seedFleet(fleet), contentWrapper: WithLocation, initialUrl }),
];

const STORY_AGENT_COUNT = STORY_FLEET.actors.filter(({ agent }) => agent !== null).length;

const AGENTS_URL = `/c/${STORYBOOK_CLUSTER_NAME}/factory/agents`;

const rowOf = (cell: HTMLElement) => within(cell.closest("tr")!);

const issueLinks = (canvas: Canvas) => canvas.getAllByRole("link", { name: /^krci\/[\w-]+#\d+$/ });

const issueTexts = (canvas: Canvas) => issueLinks(canvas).map((link: HTMLElement) => link.textContent);

async function pick(canvasElement: HTMLElement, label: string, option: string) {
  await userEvent.click(await within(canvasElement).findByRole("combobox", { name: label }));
  await userEvent.click(await within(canvasElement.ownerDocument.body).findByRole("option", { name: option }));
}

export const Ready: Story = {
  decorators: withFleet(STORY_FLEET),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const issue = await canvas.findByRole("link", { name: "krci/test-go-app#25" });
    await expect(issue).toHaveAttribute("href", `${AGENTS_URL}/${RUNNING_ACTOR.atespace}/${RUNNING_ACTOR.name}`);
    await expect(canvas.getByText(PAGE_DESCRIPTION.agents)).toBeVisible();

    const headers = canvas.getAllByRole("columnheader").map((header) => header.textContent);
    await expect(headers).toEqual([
      "Issue",
      "Codebase",
      "Agent profile",
      "Model",
      "Actor state",
      "Created",
      "Last change",
      "Actor",
    ]);

    const running = rowOf(issue);
    await expect(running.getByRole("link", { name: "test-go-app" })).toHaveAttribute(
      "href",
      `/c/${STORYBOOK_CLUSTER_NAME}/projects/krci/test-go-app`
    );
    await expect(running.getByText("go")).toBeVisible();
    await expect(running.getByText(RUNNING_ACTOR.agent!.model!)).toBeVisible();
    await expect(running.getByText("running")).toBeVisible();
    await expect(running.getByRole("link", { name: RUNNING_ACTOR.name })).toHaveAttribute(
      "href",
      `/c/${STORYBOOK_CLUSTER_NAME}/factory/actors/${RUNNING_ACTOR.atespace}/${RUNNING_ACTOR.name}`
    );

    const unmatched = rowOf(canvas.getByRole("link", { name: "krci/test-python-app#3" }));
    await expect(unmatched.getByText("krci/test-python-app")).toBeVisible();
    await expect(unmatched.queryByRole("link", { name: "krci/test-python-app" })).toBeNull();

    await expect(canvas.queryByRole("link", { name: PLAIN_ACTOR.name })).toBeNull();
    await expect(issueLinks(canvas)).toHaveLength(STORY_AGENT_COUNT);
  },
};

export const RowClickOpensAgentDetail: Story = {
  decorators: withFleet(STORY_FLEET, AGENTS_URL),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const crashed = rowOf(await canvas.findByRole("link", { name: "krci/test-python-app#4" }));
    await userEvent.click(crashed.getByText("crashed"));

    await waitFor(() =>
      expect(canvas.getByRole("status", { name: "Location" })).toHaveTextContent(
        `${AGENTS_URL}/${CRASHED_ACTOR.atespace}/${CRASHED_ACTOR.name}`
      )
    );
  },
};

export const ActorLinkOpensActorDetail: Story = {
  decorators: withFleet(STORY_FLEET, AGENTS_URL),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(await canvas.findByRole("link", { name: CRASHED_ACTOR.name }));

    await waitFor(() =>
      expect(canvas.getByRole("status", { name: "Location" })).toHaveTextContent(
        `/c/${STORYBOOK_CLUSTER_NAME}/factory/actors/${CRASHED_ACTOR.atespace}/${CRASHED_ACTOR.name}`
      )
    );
  },
};

export const Filtered: Story = {
  decorators: withFleet(STORY_FLEET),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(await canvas.findByRole("combobox", { name: "Codebase" }));
    await expect(await body.findByRole("option", { name: "test-go-app" })).toBeVisible();
    await userEvent.click(body.getByRole("option", { name: "test-python-app" }));

    await waitFor(() => expect(issueTexts(canvas)).toEqual(["krci/test-python-app#4"]));

    await userEvent.click(canvas.getByRole("button", { name: "Clear" }));
    await waitFor(() => expect(issueLinks(canvas)).toHaveLength(STORY_AGENT_COUNT));
  },
};

export const FilteredByActorState: Story = {
  decorators: withFleet(STORY_FLEET),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await pick(canvasElement, "Actor state", "Running");

    await waitFor(() => expect(issueTexts(canvas)).toEqual(["krci/test-go-app#25"]));
    await expect(canvas.getByRole("button", { name: "Clear" })).toBeVisible();
  },
};

export const FilteredByAgentProfile: Story = {
  decorators: withFleet(SEVERAL_AGENT_PROFILES_FLEET),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await pick(canvasElement, "Agent profile", "No agent profile");

    await waitFor(() => expect(issueTexts(canvas)).toEqual(["krci/test-go-app#26"]));
  },
};

export const FilteredByAgentProfileFromUrl: Story = {
  decorators: withFleet(SEVERAL_AGENT_PROFILES_FLEET, `${AGENTS_URL}?agentProfile=python`),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByRole("combobox", { name: "Agent profile" })).toHaveTextContent("python");
    await waitFor(() => expect(issueTexts(canvas)).toEqual(["krci/test-python-app#3", "krci/test-python-app#4"]));
  },
};

/** A hand-typed URL: the router parses `007` to the number 7. */
export const FilteredByNumericAgentProfileFromUrl: Story = {
  decorators: withFleet(
    (() => {
      const fleet = structuredClone(SEVERAL_AGENT_PROFILES_FLEET);
      fleet.actors.find(({ name }) => name === "issue-6-3")!.agent!.agentProfile = "007";
      return fleet;
    })(),
    `${AGENTS_URL}?agentProfile=007`
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByRole("combobox", { name: "Agent profile" })).toHaveTextContent("007");
    await waitFor(() => expect(issueTexts(canvas)).toEqual(["krci/test-node-app#3"]));
  },
};

const viewButton = (canvas: Canvas, name: "Table" | "By codebase") => canvas.getByRole("button", { name });

const card = async (canvas: Canvas, name: string) => within(await canvas.findByRole("region", { name }));

const cardNames = (canvas: Canvas) =>
  canvas.queryAllByRole("region").map((region: HTMLElement) => region.getAttribute("aria-label"));

const STORY_CARDS = [
  "Codebase test-go-app",
  "Codebase test-python-app",
  "Project krci/test-go-app",
  "Project krci/test-node-app",
  "Project krci/test-python-app",
];

export const ByCodebase: Story = {
  beforeEach: savedView(VIEW_MODES.GRID),
  decorators: withFleet(STORY_FLEET, AGENTS_URL),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const goApp = await card(canvas, "Codebase test-go-app");
    await expect(viewButton(canvas, "By codebase")).toHaveAttribute("aria-pressed", "true");
    await expect(viewButton(canvas, "Table")).toHaveAttribute("aria-pressed", "false");
    await expect(cardNames(canvas)).toEqual(STORY_CARDS);

    await expect(goApp.getByRole("link", { name: "test-go-app" })).toHaveAttribute(
      "href",
      `/c/${STORYBOOK_CLUSTER_NAME}/projects/krci/test-go-app`
    );
    await expect(goApp.getByText("1 agent · 1 running")).toBeVisible();
    await expect(goApp.getAllByRole("columnheader").map((header) => header.textContent)).toEqual([
      "Issue",
      "Agent profile",
      "Model",
      "Actor state",
      "Created",
      "Last change",
      "Actor",
    ]);
    await expect(goApp.getByRole("link", { name: "krci/test-go-app#25" })).toHaveAttribute(
      "href",
      `${AGENTS_URL}/${RUNNING_ACTOR.atespace}/${RUNNING_ACTOR.name}`
    );

    const nodeApp = await card(canvas, "Project krci/test-node-app");
    await expect(nodeApp.getByText("krci/test-node-app")).toBeVisible();
    await expect(nodeApp.queryByRole("link", { name: "krci/test-node-app" })).toBeNull();
    await expect(nodeApp.getByText("2 agents · 0 running")).toBeVisible();

    const chips = within(canvas.getByRole("group", { name: "Agent profile" }));
    await expect(chips.getAllByRole("button").map((chip) => chip.textContent)).toEqual([
      "All · 6",
      "go · 2",
      "node · 2",
      "python · 2",
    ]);
    await expect(chips.getByRole("button", { name: "All · 6" })).toHaveAttribute("aria-pressed", "true");
    await expect(canvas.queryByRole("combobox", { name: "Agent profile" })).toBeNull();
    await expect(canvas.getByRole("combobox", { name: "Codebase" })).toBeVisible();
    await expect(canvas.getByRole("combobox", { name: "Actor state" })).toBeVisible();
  },
};

/** A `page` param of the Table view: the cards have no pager and show all their agents. */
export const ByCodebaseIgnoresTablePage: Story = {
  beforeEach: savedView(VIEW_MODES.GRID),
  decorators: withFleet(STORY_FLEET, `${AGENTS_URL}?page=2`),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await card(canvas, "Codebase test-go-app");
    await expect(cardNames(canvas)).toEqual(STORY_CARDS);
    await expect(issueLinks(canvas)).toHaveLength(STORY_AGENT_COUNT);
    await expect(canvas.queryByText("Page not found")).toBeNull();
    await expect(canvas.queryByRole("combobox", { name: /rows per page/i })).toBeNull();
  },
};

export const ByCodebaseFilteredByCodebaseFromUrl: Story = {
  beforeEach: savedView(VIEW_MODES.GRID),
  decorators: withFleet(STORY_FLEET, `${AGENTS_URL}?codebase=test-python-app`),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByRole("combobox", { name: "Codebase" })).toHaveTextContent("test-python-app");
    await waitFor(() => expect(cardNames(canvas)).toEqual(["Codebase test-python-app"]));
  },
};

export const ByCodebaseRowClickOpensAgentDetail: Story = {
  beforeEach: savedView(VIEW_MODES.GRID),
  decorators: withFleet(STORY_FLEET, AGENTS_URL),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const pythonApp = await card(canvas, "Codebase test-python-app");
    await userEvent.click(pythonApp.getByText("crashed"));

    await waitFor(() =>
      expect(canvas.getByRole("status", { name: "Location" })).toHaveTextContent(
        `${AGENTS_URL}/${CRASHED_ACTOR.atespace}/${CRASHED_ACTOR.name}`
      )
    );
  },
};

/** The toggle saves the view; a view change keeps the filter. */
export const ViewToggle: Story = {
  decorators: withFleet(STORY_FLEET, AGENTS_URL),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await canvas.findByRole("link", { name: "krci/test-go-app#25" });
    await expect(viewButton(canvas, "Table")).toHaveAttribute("aria-pressed", "true");
    await expect(cardNames(canvas)).toEqual([]);

    await pick(canvasElement, "Actor state", "Running");
    await waitFor(() => expect(issueTexts(canvas)).toEqual(["krci/test-go-app#25"]));

    await userEvent.click(viewButton(canvas, "By codebase"));
    await expect(viewButton(canvas, "By codebase")).toHaveAttribute("aria-pressed", "true");
    await expect(LOCAL_STORAGE_SERVICE.getItem(VIEW_MODE_KEY)).toBe(VIEW_MODES.GRID);
    await waitFor(() => expect(cardNames(canvas)).toEqual(["Codebase test-go-app"]));
    await expect(canvas.getByRole("combobox", { name: "Actor state" })).toHaveTextContent("Running");
    await expect(issueTexts(canvas)).toEqual(["krci/test-go-app#25"]);
    const chips = within(canvas.getByRole("group", { name: "Agent profile" }));
    await expect(chips.getAllByRole("button").map((chip) => chip.textContent)).toEqual([
      "All · 1",
      "go · 1",
      "node · 0",
      "python · 0",
    ]);

    await userEvent.click(viewButton(canvas, "Table"));
    await expect(LOCAL_STORAGE_SERVICE.getItem(VIEW_MODE_KEY)).toBe(VIEW_MODES.TABLE);
    await waitFor(() => expect(canvas.getByRole("columnheader", { name: /Codebase/ })).toBeVisible());
    await expect(cardNames(canvas)).toEqual([]);
    await expect(issueTexts(canvas)).toEqual(["krci/test-go-app#25"]);
  },
};

export const ByCodebaseFilteredByChip: Story = {
  beforeEach: savedView(VIEW_MODES.GRID),
  decorators: withFleet(STORY_FLEET, AGENTS_URL),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await card(canvas, "Codebase test-go-app");
    const chips = within(canvas.getByRole("group", { name: "Agent profile" }));

    await userEvent.click(chips.getByRole("button", { name: "python · 2" }));
    await waitFor(() =>
      expect(cardNames(canvas)).toEqual(["Codebase test-python-app", "Project krci/test-python-app"])
    );
    await expect(chips.getByRole("button", { name: "python · 2" })).toHaveAttribute("aria-pressed", "true");
    await waitFor(() =>
      expect(canvas.getByRole("status", { name: "Location" })).toHaveTextContent("agentProfile=python")
    );

    await userEvent.click(viewButton(canvas, "Table"));
    await expect(await canvas.findByRole("combobox", { name: "Agent profile" })).toHaveTextContent("python");
    await expect(issueTexts(canvas)).toEqual(["krci/test-python-app#3", "krci/test-python-app#4"]);

    await userEvent.click(viewButton(canvas, "By codebase"));
    const again = within(await canvas.findByRole("group", { name: "Agent profile" }));
    await userEvent.click(again.getByRole("button", { name: "python · 2" }));
    await waitFor(() => expect(cardNames(canvas)).toEqual(STORY_CARDS));
    await expect(again.getByRole("button", { name: "All · 6" })).toHaveAttribute("aria-pressed", "true");
  },
};

/** No agent after the filter: one empty state for the view, the one of the Table view. */
export const ByCodebaseEmpty: Story = {
  beforeEach: savedView(VIEW_MODES.GRID),
  decorators: withFleet(STORY_FLEET, `${AGENTS_URL}?agentProfile=go&actorState=crashed`),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByText("No results found!")).toBeVisible();
    await expect(canvas.getAllByText("No results found!")).toHaveLength(1);
    await expect(canvas.queryByText("No agents")).toBeNull();
    await expect(cardNames(canvas)).toEqual([]);
    const chips = within(canvas.getByRole("group", { name: "Agent profile" }));
    await expect(chips.getByRole("button", { name: "python · 1" })).toBeVisible();

    await userEvent.click(canvas.getByRole("button", { name: "Clear" }));
    await waitFor(() => expect(cardNames(canvas)).toEqual(STORY_CARDS));
  },
};

/** Atespaces with actors, none of which hosts an agent. */
export const ByCodebaseNoAgents: Story = {
  beforeEach: savedView(VIEW_MODES.GRID),
  decorators: withFleet({ ...EMPTY_FLEET, atespaces: STORY_FLEET.atespaces, actors: [PLAIN_ACTOR] }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByText("No agents")).toBeVisible();
    await expect(canvas.queryByText("No results found!")).toBeNull();
  },
};

/** Atespaces with actors, none of which hosts an agent. */
export const Empty: Story = {
  decorators: withFleet({ ...EMPTY_FLEET, atespaces: STORY_FLEET.atespaces, actors: [PLAIN_ACTOR] }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("No agents")).toBeVisible();
  },
};

export const NoAtespaces: Story = {
  decorators: withFleet(EMPTY_FLEET),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("Factory has no atespaces yet")).toBeVisible();
  },
};

export const Unreachable: Story = {
  decorators: withFleet({ state: "unreachable", reason: "unavailable" }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("Factory is unreachable")).toBeVisible();
  },
};
