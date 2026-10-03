import { Badge, type BadgeProps } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";
import type {
  PipelineRunStopOutcome,
  StopPipelineRunsOutput,
} from "@/modules/platform/tekton/hooks/useStopPipelineRuns";
import {
  describeStopOutcome,
  pipelineRunStopReasonLabels,
} from "@/modules/platform/tekton/hooks/useStopPipelineRuns/outcome";
import { getPipelineRunRefKey, isPipelineRunStoppable, toPipelineRunRef, type PipelineRun } from "@my-project/shared";
import React from "react";

const resultBadge: Record<
  PipelineRunStopOutcome["result"],
  { label: string; variant: BadgeProps["variant"]; order: number }
> = {
  failed: { label: "Failed", variant: "error", order: 0 },
  skipped: { label: "Skipped", variant: "neutral", order: 1 },
  stopping: { label: "Stopping", variant: "info", order: 2 },
};

const getRunKey = (run: PipelineRun) => getPipelineRunRefKey(toPipelineRunRef(run));

export interface StopPipelineRunsDialogProps {
  /** Runs selected when the dialog opened; only the stoppable ones are sent. */
  pipelineRuns: PipelineRun[];
  stop: (runs: readonly PipelineRun[]) => Promise<StopPipelineRunsOutput | undefined>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called once per-run outcomes arrive, with the runs to deselect: all but those that failed to stop. */
  onStopped: (runs: PipelineRun[]) => void;
}

/**
 * Confirms, stops and reports a batch of PipelineRuns.
 *
 * - Confirm: lists the stoppable runs and counts the skipped ones.
 * - Stopping: the dialog cannot be closed.
 * - Results: one row per run, failed first. A failed request returns to confirm.
 */
export function StopPipelineRunsDialog({
  pipelineRuns,
  stop,
  open,
  onOpenChange,
  onStopped,
}: StopPipelineRunsDialogProps) {
  const [isStopping, setIsStopping] = React.useState(false);
  const [output, setOutput] = React.useState<StopPipelineRunsOutput>();

  const stoppableRuns = React.useMemo(() => pipelineRuns.filter(isPipelineRunStoppable), [pipelineRuns]);
  const skippedCount = pipelineRuns.length - stoppableRuns.length;

  const sortedResults = React.useMemo(
    () => output?.results.toSorted((a, b) => resultBadge[a.result].order - resultBadge[b.result].order),
    [output]
  );

  const handleStop = async () => {
    setIsStopping(true);
    let result: StopPipelineRunsOutput | undefined;
    try {
      result = await stop(stoppableRuns);
    } finally {
      setIsStopping(false);
    }

    if (!result) return;

    setOutput(result);
    const failedKeys = new Set(result.results.filter(({ result }) => result === "failed").map(getPipelineRunRefKey));
    onStopped(pipelineRuns.filter((run) => !failedKeys.has(getRunKey(run))));
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isStopping && onOpenChange(next)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Stop Pipelines</DialogTitle>
          {output && <DialogDescription>{describeStopOutcome(output)}</DialogDescription>}
        </DialogHeader>
        <DialogBody>
          {sortedResults ? (
            <ul className="max-h-64 overflow-y-auto text-sm">
              {sortedResults.map((outcome) => {
                const key = getPipelineRunRefKey(outcome);
                return (
                  <li key={key} className="flex items-center justify-between gap-2 py-1">
                    <span className="truncate font-mono" title={key}>
                      {key}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {outcome.reason && (
                        <span className="text-muted-foreground">{pipelineRunStopReasonLabels[outcome.reason]}</span>
                      )}
                      <Badge variant={resultBadge[outcome.result].variant}>{resultBadge[outcome.result].label}</Badge>
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col gap-2 text-sm">
              {skippedCount > 0 && <p>{skippedCount} already finished or stopping will be skipped.</p>}
              <ul className="max-h-64 overflow-y-auto font-mono">
                {stoppableRuns.map((run) => {
                  const key = getRunKey(run);
                  return (
                    <li key={run.metadata.uid} className="truncate" title={key}>
                      {key}
                    </li>
                  );
                })}
              </ul>
              <p className="text-muted-foreground">
                Cleanup tasks finish first, so runs stay in Cancelling for a moment.
              </p>
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          {output ? (
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isStopping}>
                Cancel
              </Button>
              <Button onClick={handleStop} disabled={isStopping || stoppableRuns.length === 0}>
                {isStopping ? "Stopping…" : "Stop"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
