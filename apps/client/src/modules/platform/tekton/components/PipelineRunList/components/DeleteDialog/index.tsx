import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";
import { useResourceCRUDMutation } from "@/k8s/api/hooks/useResourceCRUDMutation";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { isHistoryPipelineRun, k8sOperation, k8sPipelineRunConfig, PipelineRun } from "@my-project/shared";
import React from "react";

const CONFIRM_TEXT_VALUE = "confirm";

export const DeletionDialog = ({
  pipelineRuns,
  handleClose,
  open,
  onDelete,
}: {
  pipelineRuns: PipelineRun[];
  open: boolean;
  handleClose: () => void;
  onDelete: () => void;
}) => {
  const [value, setValue] = React.useState("");

  // An archived run is a Tekton Results record; its Kubernetes resource is gone, so only live runs are deletable.
  const liveRuns = React.useMemo(() => pipelineRuns.filter((run) => !isHistoryPipelineRun(run)), [pipelineRuns]);
  const archivedCount = pipelineRuns.length - liveRuns.length;

  const deletionDisabled = value !== CONFIRM_TEXT_VALUE || liveRuns.length === 0;

  const resourceDeleteMutation = useResourceCRUDMutation<PipelineRun, typeof k8sOperation.delete>(
    "resourceDeleteMutation",
    k8sOperation.delete,
    {
      createCustomMessages: () => ({
        success: {
          message: "Selected PipelineRuns have been deleted",
        },
      }),
    }
  );

  const handleDelete = () => {
    if (deletionDisabled) {
      return;
    }

    liveRuns.forEach((pipelineRun) => {
      resourceDeleteMutation.mutate({
        resource: pipelineRun,
        resourceConfig: k8sPipelineRunConfig,
      });
    });

    setValue("");

    if (onDelete) {
      onDelete();
    }

    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Are you sure you want to delete the selected PipelineRuns?</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col gap-2">
            {liveRuns.length === 0 ? (
              <p className="text-sm" data-testid="delete-archived-only">
                The selected PipelineRuns are archived history records. They cannot be deleted from the cluster.
              </p>
            ) : (
              <p className="text-sm" data-testid="delete-summary">
                {archivedCount > 0
                  ? `${liveRuns.length} live ${liveRuns.length === 1 ? "run" : "runs"} will be deleted. ${archivedCount} archived ${archivedCount === 1 ? "run" : "runs"} will be skipped: archived history records cannot be deleted from the cluster.`
                  : `${liveRuns.length} ${liveRuns.length === 1 ? "run" : "runs"} will be deleted.`}
              </p>
            )}
            <Label htmlFor="confirm-delete">{`Enter "${CONFIRM_TEXT_VALUE}" to start deletion`}</Label>
            <Input id="confirm-delete" value={value} onChange={(e) => setValue(e.target.value)} className="w-full" />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button onClick={handleClose} variant="ghost">
            Cancel
          </Button>
          <Button onClick={handleDelete} disabled={deletionDisabled}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
