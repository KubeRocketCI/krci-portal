import type React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRouterState } from "@tanstack/react-router";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { STORYBOOK_CLUSTER_NAME, withAppProviders } from "@sb/index";
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
import { PAGE_DESCRIPTION } from "../../../constants/hints";
import FactoryAgentsPage from "./page";

const meta = {
  title: "Modules/AgentSubstrate/FactoryAgentsPage",
  component: FactoryAgentsPage,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof FactoryAgentsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

type Canvas = ReturnType<typeof within>;

/** The story router renders the page at every path; this shows where a click went. */
function Location() {
  const href = useRouterState({ select: (state) => state.location.href });
  return <output aria-label="Location">{href}</output>;
}

function WithLocation({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Location />
    </>
  );
}

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
