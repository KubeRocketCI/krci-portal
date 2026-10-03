import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, userEvent, waitFor } from "storybook/test";
import {
  createMockPipelineRun,
  pipelineType,
  summarizePipelineRunStop,
  toPipelineRunRef,
  type PipelineRun,
} from "@my-project/shared";
import type {
  PipelineRunStopOutcome,
  StopPipelineRunsOutput,
} from "@/modules/platform/tekton/hooks/useStopPipelineRuns";
import { StopPipelineRunsDialog, type StopPipelineRunsDialogProps } from "./index";

const runningRuns: PipelineRun[] = ["sec-scan-repo1", "sec-scan-repo2", "sec-scan-repo3"].map((name) =>
  createMockPipelineRun({ name, pipelineType: pipelineType.security, status: "running", namespace: "team-a" })
);

const finishedRun = createMockPipelineRun({
  name: "sec-scan-repo4",
  pipelineType: pipelineType.security,
  status: "succeeded",
  namespace: "team-a",
});

const selectedRuns = [...runningRuns, finishedRun];
const [stoppingRun, skippedRun, failedRun] = runningRuns;

const stopLabel = "Stop";
const title = "Stop Pipelines";

const respond = (results: PipelineRunStopOutcome[]): StopPipelineRunsOutput => ({
  results,
  summary: summarizePipelineRunStop(results),
});

const partialOutput = respond([
  { ...toPipelineRunRef(stoppingRun), result: "stopping" },
  { ...toPipelineRunRef(skippedRun), result: "skipped", reason: "already_done" },
  { ...toPipelineRunRef(failedRun), result: "failed", reason: "forbidden" },
]);

const allStoppingOutput = respond(runningRuns.map((run) => ({ ...toPipelineRunRef(run), result: "stopping" })));

const meta = {
  title: "Feature/StopPipelineRunsDialog",
  component: StopPipelineRunsDialog,
  args: {
    pipelineRuns: selectedRuns,
    stop: fn<StopPipelineRunsDialogProps["stop"]>(async () => partialOutput),
    open: true,
    onOpenChange: fn(),
    onStopped: fn(),
  },
} satisfies Meta<typeof StopPipelineRunsDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Stoppable runs are listed; finished ones are counted as skipped. */
export const Confirm: Story = {
  play: async () => {
    await expect(await screen.findByRole("heading", { name: title })).toBeInTheDocument();
    await expect(
      screen.getByText(`${selectedRuns.length - runningRuns.length} already finished or stopping will be skipped.`)
    ).toBeInTheDocument();
    await expect(screen.getByRole("button", { name: stopLabel })).toBeEnabled();
    await expect(
      screen.getByText("Cleanup tasks finish first, so runs stay in Cancelling for a moment.")
    ).toBeInTheDocument();
  },
};

/** Stop and Cancel are disabled and Escape does not close while the request runs. */
export const InFlight: Story = {
  args: {
    stop: fn<StopPipelineRunsDialogProps["stop"]>(() => new Promise(() => {})),
  },
  play: async ({ args }) => {
    await userEvent.click(await screen.findByRole("button", { name: stopLabel }));

    await expect(await screen.findByRole("button", { name: "Stopping…" })).toBeDisabled();
    await expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    await userEvent.keyboard("{Escape}");
    await expect(args.onOpenChange).not.toHaveBeenCalled();
    await expect(args.stop).toHaveBeenCalledTimes(1);
  },
};

/** Per-run outcomes, failed first; every run but the failed one is handed back for deselection. */
export const PartialFailure: Story = {
  play: async ({ args }) => {
    await userEvent.click(await screen.findByRole("button", { name: stopLabel }));

    await expect(await screen.findByText("Stopping 1 of 3 PipelineRuns · 1 skipped · 1 failed")).toBeInTheDocument();
    const rows = screen.getAllByRole("listitem");
    await expect(rows[0]).toHaveTextContent(failedRun.metadata.name);
    await expect(rows[0]).toHaveTextContent("no permission");
    await expect(args.stop).toHaveBeenCalledWith(runningRuns);
    await expect(args.onStopped).toHaveBeenCalledWith(selectedRuns.filter((run) => run !== failedRun));
  },
};

/** Every run is stopping; all selected runs are handed back for deselection. */
export const AllStopping: Story = {
  args: {
    stop: fn<StopPipelineRunsDialogProps["stop"]>(async () => allStoppingOutput),
  },
  play: async ({ args }) => {
    await userEvent.click(await screen.findByRole("button", { name: stopLabel }));

    await expect(await screen.findByRole("button", { name: "Done" })).toBeEnabled();
    await expect(args.onStopped).toHaveBeenCalledWith(selectedRuns);
  },
};

/** A failed request returns to the confirm view so the user can retry. */
export const RequestFailed: Story = {
  args: {
    stop: fn<StopPipelineRunsDialogProps["stop"]>(async () => undefined),
  },
  play: async ({ args }) => {
    await userEvent.click(await screen.findByRole("button", { name: stopLabel }));

    await waitFor(() => expect(args.stop).toHaveBeenCalledTimes(1));
    await expect(await screen.findByRole("button", { name: stopLabel })).toBeEnabled();
    await expect(screen.queryByRole("button", { name: "Done" })).not.toBeInTheDocument();
    await expect(args.onStopped).not.toHaveBeenCalled();
  },
};

/** Nothing selected is stoppable. */
export const NothingToStop: Story = {
  args: {
    pipelineRuns: [finishedRun],
  },
  play: async () => {
    await expect(await screen.findByRole("button", { name: stopLabel })).toBeDisabled();
  },
};
