import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";
import { withAppProviders } from "@sb/index";
import type { RequestError } from "@/core/types/global";
import {
  FINISHED_REVIEW_RUNS,
  EXTRA_REVIEW_RUNS,
  MANY_REVIEW_RUNS,
  NO_REVIEW_RUN,
  RUNNING_REVIEW_RUNS,
} from "../../../../../__fixtures__/storyReviewRuns";
import { AgentProducedBlock, NO_CODEBASE_TEXT, NO_MERGE_REQUEST_TEXT, REVIEW_RUN_ICON_COUNT } from ".";

const CODEBASE = { name: "test-go-app", namespace: "krci" };

const meta = {
  title: "Modules/AgentSubstrate/AgentProducedBlock",
  component: AgentProducedBlock,
  tags: ["autodocs"],
  decorators: [withAppProviders()],
  args: { codebase: CODEBASE, mergeRequests: RUNNING_REVIEW_RUNS.mergeRequests, isLoading: false, error: null },
} satisfies Meta<typeof AgentProducedBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

const produced = async (canvasElement: HTMLElement) =>
  within(await within(canvasElement).findByRole("region", { name: "Produced" }));

const runLinks = (scope: ReturnType<typeof within>) =>
  scope
    .getAllByRole("link")
    .filter((link: HTMLElement) => link.getAttribute("href")?.startsWith("/c/in-cluster/cicd/pipelineruns/krci/"));

export const RunningRun: Story = {
  play: async ({ canvasElement }) => {
    const block = await produced(canvasElement);

    await expect(block.getByRole("link", { name: "!5" })).toHaveAttribute(
      "href",
      "https://gitlab.example.com/krci/test-go-app/-/merge_requests/5"
    );
    await expect(block.getByText("agent/issue-32 → main")).toBeVisible();

    const links = runLinks(block);
    await expect(links).toHaveLength(3);
    await expect(links[2]).toHaveAttribute("href", "/c/in-cluster/cicd/pipelineruns/krci/test-go-app-review-x7k2p");
    await expect(links[2]).toHaveAccessibleName(/^test-go-app-review-x7k2p · Running · /);
    await expect(links[0]).toHaveAccessibleName(/^test-go-app-review-f1 · /);

    await expect(block.getByText("Running", { selector: "span" })).toBeVisible();
    await expect(block.getByText("9a8b7c6")).toBeVisible();
  },
};

export const FinishedRuns: Story = {
  args: { mergeRequests: FINISHED_REVIEW_RUNS.mergeRequests },
  play: async ({ canvasElement }) => {
    const block = await produced(canvasElement);

    const links = runLinks(block);
    await expect(links).toHaveLength(2);
    await expect(links[1]).toHaveAccessibleName(/^test-go-app-review-f2 · Succeeded · 3m 30s$/);
    await expect(block.getByText("2f1c2e9")).toBeVisible();
    await expect(block.queryByText(/^\+\d+$/)).toBeNull();
  },
};

export const MoreRunsThanIcons: Story = {
  args: { mergeRequests: MANY_REVIEW_RUNS.mergeRequests },
  play: async ({ canvasElement }) => {
    const block = await produced(canvasElement);

    const links = runLinks(block);
    await expect(links).toHaveLength(REVIEW_RUN_ICON_COUNT);
    await expect(links[0]).toHaveAccessibleName(new RegExp(`^test-go-app-review-f${EXTRA_REVIEW_RUNS + 1} · `));
    await expect(links[REVIEW_RUN_ICON_COUNT - 1]).toHaveAccessibleName(
      new RegExp(`^test-go-app-review-f${REVIEW_RUN_ICON_COUNT + EXTRA_REVIEW_RUNS} · `)
    );

    const more = block.getByRole("link", { name: `+${EXTRA_REVIEW_RUNS}: review runs of test-go-app` });
    await expect(more).toHaveTextContent(`+${EXTRA_REVIEW_RUNS}`);
    const search = new URLSearchParams((more.getAttribute("href") ?? "").split("?")[1]);
    await expect(more.getAttribute("href")).toMatch(/^\/c\/in-cluster\/cicd\/pipelineruns\?/);
    await expect(search.get("codebases")).toBe('["test-go-app"]');
    await expect(search.get("pipelineType")).toBe("review");
  },
};

const [FINISHED_MERGE_REQUEST] = FINISHED_REVIEW_RUNS.mergeRequests;

export const CancelledRunWithNoCompletionTime: Story = {
  args: {
    mergeRequests: [
      {
        ...FINISHED_MERGE_REQUEST,
        reviewRuns: [
          {
            ...FINISHED_MERGE_REQUEST.reviewRuns[0],
            name: "test-go-app-review-c1",
            status: { phase: "cancelled", reason: "cancelled" },
            durationMs: null,
          },
        ],
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const block = await produced(canvasElement);

    await expect(runLinks(block)[0]).toHaveAccessibleName("test-go-app-review-c1 · Cancelled");
  },
};

export const NoRun: Story = {
  args: { mergeRequests: NO_REVIEW_RUN.mergeRequests },
  play: async ({ canvasElement }) => {
    const block = await produced(canvasElement);

    await expect(block.getByText(NO_MERGE_REQUEST_TEXT)).toBeVisible();
  },
};

export const NoCodebase: Story = {
  args: { codebase: null, mergeRequests: undefined },
  play: async ({ canvasElement }) => {
    const block = await produced(canvasElement);

    await expect(block.getByText(NO_CODEBASE_TEXT)).toBeVisible();
    await expect(block.queryByRole("table")).toBeNull();
  },
};

const SERVER_ERROR = { message: "Review run read failed", data: { httpStatus: 500 } } as unknown as RequestError;

export const ReadFailed: Story = {
  args: { mergeRequests: undefined, error: SERVER_ERROR },
  play: async ({ canvasElement }) => {
    const block = await produced(canvasElement);

    await expect(await block.findByText("Something went wrong. Contact your administrator.")).toBeVisible();
    await expect(block.queryByRole("table")).toBeNull();
    await expect(block.queryByText(NO_MERGE_REQUEST_TEXT)).toBeNull();
  },
};

export const RefreshFailed: Story = {
  args: { mergeRequests: FINISHED_REVIEW_RUNS.mergeRequests, error: SERVER_ERROR },
  play: async ({ canvasElement }) => {
    const block = await produced(canvasElement);

    await expect(await block.findByText("Something went wrong. Contact your administrator.")).toBeVisible();
    await expect(block.getByRole("link", { name: "!5" })).toBeVisible();
    await expect(runLinks(block)).toHaveLength(2);
  },
};
