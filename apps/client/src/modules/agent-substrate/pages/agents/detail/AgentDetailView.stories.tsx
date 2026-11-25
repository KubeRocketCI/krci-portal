import type React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { withAppProviders } from "@sb/index";
import { SidebarPinnedSection } from "@/core/components/sidebar/SidebarPinnedSection";
import { SidebarProvider } from "@/core/components/ui/sidebar";
import {
  ACTOR_NOT_FOUND,
  CRASHED_AGENT,
  EGRESS_POLICY_UNREADABLE_AGENT,
  EVERY_RULE_KIND_AGENT,
  NO_EGRESS_POLICY_AGENT,
  NOT_AN_AGENT,
  ONE_TURN_AGENT,
  RUNNING_AGENT,
  STORY_FLEET_WITH_RUNNING_AGENT,
  SUSPENDED_AGENT,
  UNLINKED_AGENT,
  agentRefOf,
  seedAgent,
} from "../../../__fixtures__/storyAgent";
import { RUNNING_REVIEW_RUNS } from "../../../__fixtures__/storyReviewRuns";
import { PAGE_DESCRIPTION } from "../../../constants/hints";
import { FLEET_QUERY_KEY } from "../../../hooks/useFleet";
import { AgentDetailView } from "./view";

const RUNNING_REF = agentRefOf(RUNNING_AGENT);
const SUSPENDED_REF = agentRefOf(SUSPENDED_AGENT);
const CRASHED_REF = agentRefOf(CRASHED_AGENT);
const MISSING_REF = { atespace: "krci-agents", name: "issue-9-9" };
const PLAIN_REF = { atespace: "krci-sandbox", name: "debug-shell" };

const meta = {
  title: "Modules/AgentSubstrate/AgentDetailView",
  component: AgentDetailView,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [
    withAppProviders({
      seedQueryCache: seedAgent(RUNNING_REF, RUNNING_AGENT, STORY_FLEET_WITH_RUNNING_AGENT, RUNNING_REVIEW_RUNS),
    }),
  ],
  args: RUNNING_REF,
} satisfies Meta<typeof AgentDetailView>;

export default meta;
type Story = StoryObj<typeof meta>;

const region = async (canvasElement: HTMLElement, name: string) =>
  within(await within(canvasElement).findByRole("region", { name }));

/** The value of a term: the `dd` after its `dt`. */
const fact = (scope: ReturnType<typeof within>, term: string) =>
  scope.getByText(term, { selector: "dt" }).nextElementSibling as HTMLElement;

/** The InfoColumns value: the element after its label. */
const headerFact = (scope: ReturnType<typeof within>, label: string) =>
  scope.getByText(label).nextElementSibling as HTMLElement;

const rowTexts = (scope: ReturnType<typeof within>) =>
  scope
    .getAllByRole("row")
    .slice(1)
    .map((row: HTMLElement) =>
      within(row)
        .getAllByRole("cell")
        .map((cell: HTMLElement) => cell.textContent)
    );

/** PageWrapper renders the breadcrumbs as siblings of the first one, "Factory". */
const breadcrumb = (canvasElement: HTMLElement) => within(within(canvasElement).getByText("Factory").parentElement!);

export const Running: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const header = await region(canvasElement, "Agent");

    await expect(canvas.getByText(PAGE_DESCRIPTION.agentDetail)).toBeVisible();
    await expect(canvas.getAllByText("krci/test-go-app#32")[0]).toBeVisible();

    const crumbs = breadcrumb(canvasElement);
    for (const label of ["Factory", "Agents", "krci/test-go-app", "#32"]) {
      await expect(crumbs.getByText(label)).toBeVisible();
    }
    await expect(crumbs.getByRole("link", { name: "Agents" })).toHaveAttribute("href", "/c/in-cluster/factory/agents");
    await expect(canvas.getByRole("button", { name: "Pin to sidebar" })).toBeVisible();

    await expect(header.getByRole("link", { name: "krci/test-go-app#32" })).toHaveAttribute(
      "href",
      "https://gitlab.example.com/krci/test-go-app/-/issues/32"
    );
    await expect(headerFact(header, "Actor state")).toHaveTextContent("running");
    await expect(headerFact(header, "Turn limit")).toHaveTextContent("20 turns");
    await expect(headerFact(header, "Issue branch")).toHaveTextContent("agent/issue-32");
    await expect(header.getByRole("link", { name: "test-go-app" })).toHaveAttribute(
      "href",
      "/c/in-cluster/projects/krci/test-go-app"
    );

    const produced = await region(canvasElement, "Produced");
    const sections = canvas.getAllByRole("region").map((section) => section.getAttribute("aria-labelledby"));
    await expect(sections.indexOf("agent-produced-title")).toBeLessThan(sections.indexOf("agent-profile-title"));
    await expect(produced.getByRole("link", { name: "!5" })).toHaveAttribute(
      "href",
      "https://gitlab.example.com/krci/test-go-app/-/merge_requests/5"
    );

    const profile = await region(canvasElement, "Agent profile");
    await expect(fact(profile, "Agent profile")).toHaveTextContent("go");
    await expect(fact(profile, "Agent model")).toHaveTextContent("claude-haiku-5-5");
    await expect(fact(profile, "Agent image")).toHaveTextContent(
      "epamedp/krci-agent-go:0.2.0@sha256:6b1f9a1edca599ea02e1620e2ae2d924782758140e9d48810c083dfa74431176"
    );
    await expect(profile.queryByText("Profile env")).toBeNull();

    const actor = await region(canvasElement, "Actor");
    await expect(actor.getByRole("link", { name: "issue-2-32" })).toHaveAttribute(
      "href",
      "/c/in-cluster/factory/actors/krci-agents/issue-2-32"
    );
    await expect(fact(actor, "Atespace")).toHaveTextContent("krci-agents");
    await expect(fact(actor, "Actor template")).toHaveTextContent("issue-2-32");
    await expect(fact(actor, "Limits")).toHaveTextContent("1.0 CPU, 2.0 Gi");
    const worker = within(fact(actor, "Worker"));
    await expect(worker.getByRole("link", { name: "krci-agents/workers" })).toHaveAttribute(
      "href",
      "/c/in-cluster/factory/worker-pools#worker-pool/krci-agents/workers"
    );
    await expect(worker.getByText("workers-7485fd78cd-wslff")).toBeVisible();
    await expect(worker.getByText("krci-control-plane")).toBeVisible();
    await expect(fact(actor, "Sandbox class")).toHaveTextContent("gvisor");
    await expect(fact(actor, "Worker selector")).toHaveTextContent("workload=workers");
    const canRunOn = within(fact(actor, "Can run on"));
    await expect(canRunOn.getByRole("link", { name: "krci-agents/workers" })).toBeVisible();
    await expect(canRunOn.getByRole("link", { name: "krci-agents/workers-microvm" })).toBeVisible();
    await expect(fact(actor, "Snapshot fidelity")).toHaveTextContent("preferred memory · newest no snapshot yet");
    for (const term of ["Created", "Last change"]) {
      await expect(fact(actor, term)).not.toHaveTextContent(/^—$/);
    }
    await expect(actor.getByRole("button", { name: "About Sandbox class" })).toBeVisible();
    await expect(actor.getByRole("button", { name: "About Can run on" })).toBeVisible();

    const egressRegion = await region(canvasElement, "Egress policy");
    await expect(rowTexts(egressRegion)).toEqual([
      ["HTTPS", "api.anthropic.com", "443", "x-api-key"],
      ["HTTPS", "gitlab.example.com", "443", 'Authorization ("Basic "), PRIVATE-TOKEN'],
      ["TLS passthrough", "proxy.golang.org, sum.golang.org, storage.googleapis.com", "443", "—"],
    ]);
    await expect(egressRegion.getByText("Every other host is denied.")).toBeVisible();
    const regions = within(canvasElement).getAllByRole("region");
    await expect(regions[regions.length - 1]).toHaveAccessibleName("Egress policy");
  },
};

export const NoEgressPolicy: Story = {
  decorators: [withAppProviders({ seedQueryCache: seedAgent(SUSPENDED_REF, NO_EGRESS_POLICY_AGENT) })],
  args: SUSPENDED_REF,
  play: async ({ canvasElement }) => {
    const egressRegion = await region(canvasElement, "Egress policy");

    await expect(egressRegion.getByText("The actor has no egress policy")).toBeVisible();
    await expect(egressRegion.queryByRole("table")).toBeNull();
    await expect(egressRegion.queryByText("Every other host is denied.")).toBeNull();
    await expect(egressRegion.queryByRole("alert")).toBeNull();
  },
};

export const EgressRulesOfEveryKind: Story = {
  decorators: [withAppProviders({ seedQueryCache: seedAgent(SUSPENDED_REF, EVERY_RULE_KIND_AGENT) })],
  args: SUSPENDED_REF,
  play: async ({ canvasElement }) => {
    const egressRegion = await region(canvasElement, "Egress policy");

    await expect(rowTexts(egressRegion)).toEqual([
      ["HTTP", "mirror.example.com", "80, 8080", "—"],
      ["TLS passthrough", "*.example.org", "All", "—"],
      ["Unknown", "—", "—", "—"],
    ]);
    await expect(
      egressRegion.getByText("The egress policy holds a rule of a kind that the portal cannot show.")
    ).toBeVisible();
    await expect(egressRegion.queryByText("Every other host is denied.")).toBeNull();
  },
};

export const EgressPolicyUnreadable: Story = {
  decorators: [withAppProviders({ seedQueryCache: seedAgent(SUSPENDED_REF, EGRESS_POLICY_UNREADABLE_AGENT) })],
  args: SUSPENDED_REF,
  play: async ({ canvasElement }) => {
    const egressRegion = await region(canvasElement, "Egress policy");

    await expect(egressRegion.getByText("The egress policy could not be read")).toBeVisible();
    await expect(egressRegion.getByText("Reason: permission denied.")).toBeVisible();
    await expect(egressRegion.queryByRole("table")).toBeNull();
    await expect(egressRegion.queryByText("Every other host is denied.")).toBeNull();
    await expect(await region(canvasElement, "Actor")).toBeTruthy();
  },
};

export const Suspended: Story = {
  decorators: [withAppProviders({ seedQueryCache: seedAgent(SUSPENDED_REF, SUSPENDED_AGENT) })],
  args: SUSPENDED_REF,
  play: async ({ canvasElement }) => {
    const header = await region(canvasElement, "Agent");
    await expect(headerFact(header, "Actor state")).toHaveTextContent("suspended");

    const actor = await region(canvasElement, "Actor");
    await expect(fact(actor, "Worker")).toHaveTextContent("Not on a worker");
    await expect(within(fact(actor, "Worker")).queryByRole("link")).toBeNull();
    await expect(fact(actor, "Sandbox class")).toHaveTextContent("gvisor");
    await expect(fact(actor, "Snapshot fidelity")).toHaveTextContent("preferred memory · newest memory");
    await expect(actor.queryByRole("alert")).toBeNull();
  },
};

export const Crashed: Story = {
  decorators: [withAppProviders({ seedQueryCache: seedAgent(CRASHED_REF, CRASHED_AGENT) })],
  args: CRASHED_REF,
  play: async ({ canvasElement }) => {
    const actor = await region(canvasElement, "Actor");

    const alert = actor.getByRole("alert");
    await expect(alert).toHaveTextContent("sandbox exited with code 137: out of memory");
    await expect(alert).toHaveTextContent(/Crashed at/);
    await expect(fact(actor, "Worker")).toHaveTextContent("Not on a worker");

    const header = await region(canvasElement, "Agent");
    await expect(headerFact(header, "Actor state")).toHaveTextContent("crashed");
    await expect(breadcrumb(canvasElement).getByText("krci/test-python-app")).toBeVisible();
  },
};

export const NoCodebaseNoTurnLimit: Story = {
  decorators: [withAppProviders({ seedQueryCache: seedAgent(SUSPENDED_REF, UNLINKED_AGENT) })],
  args: SUSPENDED_REF,
  play: async ({ canvasElement }) => {
    const header = await region(canvasElement, "Agent");

    await expect(header.queryByRole("link")).toBeNull();
    await expect(headerFact(header, "Issue")).toHaveTextContent("krci/test-go-app#26");
    await expect(headerFact(header, "Codebase")).toHaveTextContent("krci/test-go-app");
    await expect(headerFact(header, "Turn limit")).toHaveTextContent(/^—$/);

    const profile = await region(canvasElement, "Agent profile");
    await expect(fact(profile, "Agent image")).toHaveTextContent(/^—$/);

    const actor = await region(canvasElement, "Actor");
    await expect(fact(actor, "Sandbox class")).toHaveTextContent(/^—$/);
    await expect(fact(actor, "Snapshot fidelity")).toHaveTextContent("preferred not set · newest no snapshot yet");
  },
};

export const CanRunOnBeforeTheFleetRead: Story = {
  decorators: [
    withAppProviders({
      seedQueryCache: (queryClient) => {
        seedAgent(SUSPENDED_REF, SUSPENDED_AGENT)(queryClient);
        queryClient.setQueryData(FLEET_QUERY_KEY, { state: "notConfigured" });
      },
    }),
  ],
  args: SUSPENDED_REF,
  play: async ({ canvasElement }) => {
    const actor = await region(canvasElement, "Actor");
    await expect(fact(actor, "Can run on")).toHaveTextContent(/^—$/);
  },
};

export const NoWorkerPoolOneTurn: Story = {
  decorators: [
    withAppProviders({
      seedQueryCache: seedAgent(SUSPENDED_REF, ONE_TURN_AGENT, {
        ...STORY_FLEET_WITH_RUNNING_AGENT,
        actors: STORY_FLEET_WITH_RUNNING_AGENT.actors.map((row) =>
          row.name === SUSPENDED_REF.name ? { ...row, usableWorkerPools: [] } : row
        ),
      }),
    }),
  ],
  args: SUSPENDED_REF,
  play: async ({ canvasElement }) => {
    const header = await region(canvasElement, "Agent");
    await expect(headerFact(header, "Turn limit")).toHaveTextContent(/^1 turn$/);

    const actor = await region(canvasElement, "Actor");
    await expect(fact(actor, "Can run on")).toHaveTextContent("No worker pool");
  },
};

export const NotAnAgent: Story = {
  decorators: [withAppProviders({ seedQueryCache: seedAgent(PLAIN_REF, NOT_AN_AGENT) })],
  args: PLAIN_REF,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByText("Not an agent")).toBeVisible();
    await expect(canvas.getByRole("link", { name: "Open the actor" })).toHaveAttribute(
      "href",
      "/c/in-cluster/factory/actors/krci-sandbox/debug-shell"
    );
    await expect(breadcrumb(canvasElement).getByText("debug-shell")).toBeVisible();
    await expect(canvas.queryByRole("region", { name: "Actor" })).toBeNull();
    await expect(canvas.queryByRole("button", { name: "Pin to sidebar" })).toBeNull();
  },
};

export const ActorNotFound: Story = {
  decorators: [withAppProviders({ seedQueryCache: seedAgent(MISSING_REF, ACTOR_NOT_FOUND) })],
  args: MISSING_REF,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByText("Actor not found")).toBeVisible();
    await expect(canvas.getByText("Factory has no actor issue-9-9 in atespace krci-agents.")).toBeVisible();
    await expect(breadcrumb(canvasElement).getByText("issue-9-9")).toBeVisible();
  },
};

export const Unreachable: Story = {
  decorators: [
    withAppProviders({ seedQueryCache: seedAgent(RUNNING_REF, { state: "unreachable", reason: "unavailable" }) }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByText("Factory is unreachable")).toBeVisible();
    await expect(canvas.getByText("Reason: network or TLS failure")).toBeVisible();
    await expect(breadcrumb(canvasElement).getByText("issue-2-32")).toBeVisible();
  },
};

export const KeptAfterUnreachableRefresh: Story = {
  decorators: [
    withAppProviders({ seedQueryCache: seedAgent(RUNNING_REF, { ...RUNNING_AGENT, refreshFailure: "unavailable" }) }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(await canvas.findByText("Factory unreachable: network or TLS failure")).toBeVisible();
    await expect(await region(canvasElement, "Actor")).toBeTruthy();
    await expect(canvas.queryByText("Factory is unreachable")).toBeNull();
  },
};

export const NotConfigured: Story = {
  decorators: [withAppProviders({ seedQueryCache: seedAgent(RUNNING_REF, { state: "notConfigured" }) })],
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("Factory is not configured")).toBeVisible();
  },
};

export const Loading: Story = {
  decorators: [withAppProviders({ seedQueryCache: seedAgent(RUNNING_REF, undefined) })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getAllByText("issue-2-32").length).toBeGreaterThan(0);
    await expect(breadcrumb(canvasElement).getByText("issue-2-32")).toBeVisible();
    await expect(canvas.queryByRole("region", { name: "Agent" })).toBeNull();
    await expect(canvas.queryByRole("button", { name: "Pin to sidebar" })).toBeNull();
  },
};

function WithPinnedSection({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <SidebarPinnedSection />
      {children}
    </SidebarProvider>
  );
}

/** The pin is stored in local storage; the story unpins at the end. */
export const PinsTheAgent: Story = {
  decorators: [
    withAppProviders({ seedQueryCache: seedAgent(RUNNING_REF, RUNNING_AGENT), contentWrapper: WithPinnedSection }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const agentDetailHref = "/c/in-cluster/factory/agents/krci-agents/issue-2-32";
    const pinnedLink = () =>
      canvas
        .queryAllByRole("link", { name: "krci/test-go-app#32" })
        .find((link: HTMLElement) => link.getAttribute("href") === agentDetailHref);

    await userEvent.click(await canvas.findByRole("button", { name: "Pin to sidebar" }));
    try {
      await waitFor(() => expect(pinnedLink()).toBeVisible());
      await expect(canvas.getByRole("button", { name: "Unpin from sidebar" })).toBeVisible();
    } finally {
      const unpin = canvas.queryByRole("button", { name: "Unpin from sidebar" });
      if (unpin) await userEvent.click(unpin);
    }
    await waitFor(() => expect(pinnedLink()).toBeUndefined());
  },
};
