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
import { k8sOperation, k8sPipelineRunConfig, PipelineRun } from "@my-project/shared";
import React from "react";

const CONFIRM_TEXT_VALUE = "confirm";

export const DeletionDialog = ({
  items,
  selected,
  handleClose,
  open,
  onDelete,
}: {
  items: PipelineRun[];
  selected: string[];
  open: boolean;
  handleClose: () => void;
  onDelete: () => void;
}) => {
  const itemsByNameMap: Map<string, PipelineRun> | null = React.useMemo(() => {
    if (items === null) {
      return null;
    }

    return new Map(items.map((item) => [item.metadata.name, item]));
  }, [items]);

  const selectedPipelineRuns = React.useMemo(() => {
    if (selected === null || !itemsByNameMap) {
      return null;
    }

    return selected.map((name) => itemsByNameMap.get(name));
  }, [itemsByNameMap, selected]);

  const [value, setValue] = React.useState("");

  const deletionDisabled = value !== CONFIRM_TEXT_VALUE;

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
    if (deletionDisabled || !selectedPipelineRuns) {
      return;
    }

    selectedPipelineRuns.forEach((pipelineRun: PipelineRun | undefined) => {
      if (!pipelineRun) {
        return;
      }

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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure you want to delete the selected PipelineRuns?</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col gap-2">
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
