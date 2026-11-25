import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { withAppProviders } from "@sb/index";
import type { RequestError } from "@/core/types/global";
import { RUNNING_AGENT, UNLINKED_AGENT } from "../../../../../__fixtures__/storyAgent";
import { FINISHED_REVIEW_RUNS, HISTORY_UNREACHABLE_REVIEW_RUNS } from "../../../../../__fixtures__/storyReviewRuns";
import { HISTORY_UNREACHABLE_TEXT, NO_CODEBASE_TEXT } from "../AgentProducedCard";
import { AgentDiagram } from ".";

function foundOf(read: typeof RUNNING_AGENT) {
  if (read.result.kind !== "agent") throw new Error("the fixture holds no agent");
  return read.result;
}

const RUNNING = foundOf(RUNNING_AGENT);

const SERVER_ERROR = { message: "Review run read failed", data: { httpStatus: 500 } } as unknown as RequestError;

const ERROR_TEXT = "Something went wrong. Contact your administrator.";

const meta = {
  title: "Modules/AgentSubstrate/AgentDiagram",
  component: AgentDiagram,
  tags: ["autodocs"],
  decorators: [withAppProviders()],
  args: {
    agent: RUNNING.agent,
    actor: RUNNING.actor,
    egressPolicy: RUNNING.egressPolicy,
    usableWorkerPools: null,
    reviewRuns: { mergeRequests: undefined, history: undefined, isLoading: false, error: SERVER_ERROR },
  },
} satisfies Meta<typeof AgentDiagram>;

export default meta;
type Story = StoryObj<typeof meta>;

const box = (canvasElement: HTMLElement, type: string) =>
  within(within(canvasElement).getByRole("group", { name: type }));

const selectButton = (canvasElement: HTMLElement, type: string) =>
  box(canvasElement, type).getByRole("button", { name: new RegExp(`^${type}`) });

export const ReviewRunReadFailed: Story = {
  play: async ({ canvasElement }) => {
    for (const type of ["Merge request", "Review runs"]) {
      await expect(selectButton(canvasElement, type)).toHaveTextContent(`${type}Not read`);
      await expect(await box(canvasElement, type).findByText(ERROR_TEXT)).toBeVisible();
    }
    await expect(selectButton(canvasElement, "Issue")).toHaveTextContent("Issuekrci/test-go-app#32");
    await expect(selectButton(canvasElement, "Actor")).toHaveTextContent("Actorissue-2-32");
    await expect(box(canvasElement, "Egress policy").getByText("3 rules · 5 hosts")).toBeVisible();

    await userEvent.click(selectButton(canvasElement, "Merge request"));
    const inspector = within(within(canvasElement).getByRole("region", { name: "Inspector" }));
    await expect(await inspector.findByText(ERROR_TEXT)).toBeVisible();
    await expect(inspector.queryByText("Branches")).toBeNull();
  },
};

export const ReviewRunRefreshFailed: Story = {
  args: { reviewRuns: { ...FINISHED_REVIEW_RUNS, isLoading: false, error: SERVER_ERROR } },
  play: async ({ canvasElement }) => {
    await expect(selectButton(canvasElement, "Merge request")).toHaveTextContent("Merge request!5");
    await expect(await box(canvasElement, "Merge request").findByText(ERROR_TEXT)).toBeVisible();
    await expect(selectButton(canvasElement, "Review runs")).toHaveTextContent("Review runs2 review runs");

    await userEvent.click(selectButton(canvasElement, "Merge request"));
    const inspector = within(within(canvasElement).getByRole("region", { name: "Inspector" }));
    await expect(await inspector.findByText(ERROR_TEXT)).toBeVisible();
    await expect(inspector.getByRole("link", { name: "!5" })).toBeVisible();
  },
};

export const NoCodebase: Story = {
  args: {
    agent: foundOf(UNLINKED_AGENT).agent,
    reviewRuns: { mergeRequests: undefined, history: undefined, isLoading: false, error: null },
  },
  play: async ({ canvasElement }) => {
    for (const type of ["Merge request", "Review runs"]) {
      await expect(selectButton(canvasElement, type)).toHaveTextContent(`${type}None`);
      await expect(box(canvasElement, type).getByText(NO_CODEBASE_TEXT)).toBeVisible();
    }
    await expect(box(canvasElement, "Issue").queryByRole("link")).toBeNull();
    await expect(box(canvasElement, "Agent").getByText("no turn limit")).toBeVisible();
  },
};

export const NoAgentProfileAndNoModel: Story = {
  args: { agent: { ...RUNNING.agent, agentProfile: null, model: null } },
  play: async ({ canvasElement }) => {
    await expect(selectButton(canvasElement, "Agent")).toHaveTextContent(/^AgentAgent$/);
  },
};

export const ModelOnly: Story = {
  args: { agent: { ...RUNNING.agent, agentProfile: null } },
  play: async ({ canvasElement }) => {
    await expect(selectButton(canvasElement, "Agent")).toHaveTextContent(/^Agentclaude-haiku-5-5$/);
  },
};

const inspectorOf = (canvasElement: HTMLElement) =>
  within(within(canvasElement).getByRole("region", { name: "Inspector" }));

/** The value of a term: the `dd` after its `dt`. */
const fact = (scope: ReturnType<typeof within>, term: string) =>
  scope.getByText(term, { selector: "dt" }).nextElementSibling as HTMLElement;

const [FINISHED_MERGE_REQUEST] = FINISHED_REVIEW_RUNS.mergeRequests;

export const ReviewRunLoading: Story = {
  args: { reviewRuns: { mergeRequests: undefined, history: undefined, isLoading: true, error: null } },
  play: async ({ canvasElement }) => {
    await expect(selectButton(canvasElement, "Merge request")).toHaveTextContent("Merge requestLoading");

    await userEvent.click(selectButton(canvasElement, "Merge request"));
    const busy = canvasElement.querySelector("[aria-label='Inspector'] [aria-busy='true']");
    await expect(busy).not.toBeNull();
  },
};

export const ReviewRunWithoutCommit: Story = {
  args: {
    reviewRuns: {
      mergeRequests: [
        {
          ...FINISHED_MERGE_REQUEST,
          reviewRuns: FINISHED_MERGE_REQUEST.reviewRuns.map((run) => ({ ...run, commit: null })),
        },
      ],
      history: "ready",
      isLoading: false,
      error: null,
    },
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(selectButton(canvasElement, "Review runs"));
    await expect(fact(inspectorOf(canvasElement), "Commit")).toHaveTextContent(/^—$/);
  },
};

export const ManyMergeRequests: Story = {
  args: {
    reviewRuns: {
      mergeRequests: ["7", "6", "5"].map((number) => ({ ...FINISHED_MERGE_REQUEST, number })),
      history: "ready",
      isLoading: false,
      error: null,
    },
  },
  play: async ({ canvasElement }) => {
    await expect(selectButton(canvasElement, "Merge request")).toHaveTextContent(/^Merge request!7 \+2$/);
    await expect(selectButton(canvasElement, "Review runs")).toHaveTextContent("Review runs6 review runs");
  },
};

export const EgressPolicyCounts: Story = {
  args: {
    egressPolicy: {
      state: "ready",
      rules: [
        { kind: "http", hosts: ["mirror.example.com"], ports: [80], credentials: [] },
        { kind: "https", hosts: ["mirror.example.com"], ports: [443], credentials: [] },
        { kind: "tlsPassthrough", hosts: ["*.example.org"], ports: "all", credentials: [] },
        { kind: "unknown", hosts: [], ports: [], credentials: [] },
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await expect(box(canvasElement, "Egress policy").getByText("4 rules · 2 hosts · 1 unknown rule")).toBeVisible();
  },
};

const FORBIDDEN = { message: "Forbidden", data: { httpStatus: 403 } } as unknown as RequestError;

export const DialogClickKeepsTheSelection: Story = {
  args: { reviewRuns: { mergeRequests: undefined, history: undefined, isLoading: false, error: FORBIDDEN } },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);

    /** The modal dialog hides the diagram from role queries. */
    const pressedBox = () =>
      canvasElement.querySelector("button[aria-pressed='true']")?.closest("[role='group']")?.getAttribute("aria-label");

    await userEvent.click(box(canvasElement, "Merge request").getByRole("button", { name: "More details" }));
    await expect(pressedBox()).toBe("Actor");

    const dialog = within(await body.findByRole("dialog"));
    await userEvent.click(dialog.getByText("Close", { selector: "button" }));
    await expect(pressedBox()).toBe("Actor");
  },
};

export const HistoryUnreachable: Story = {
  args: { reviewRuns: { ...HISTORY_UNREACHABLE_REVIEW_RUNS, isLoading: false, error: null } },
  play: async ({ canvasElement }) => {
    await userEvent.click(selectButton(canvasElement, "Review runs"));
    await expect(inspectorOf(canvasElement).getByText(HISTORY_UNREACHABLE_TEXT)).toBeVisible();

    await userEvent.click(selectButton(canvasElement, "Merge request"));
    await expect(inspectorOf(canvasElement).queryByText(HISTORY_UNREACHABLE_TEXT)).toBeNull();
  },
};
