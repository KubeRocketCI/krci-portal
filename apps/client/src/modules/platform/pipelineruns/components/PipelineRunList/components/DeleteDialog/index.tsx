import { useResourceCRUDMutation } from "@/core/k8s/api/hooks/useResourceCRUDMutation";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
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
        onSuccess: {
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
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Are you sure you want to delete the selected PipelineRuns?</DialogTitle>
      <DialogContent sx={{ pt: "20px !important" }}>
        <TextField
          label={`Enter "${CONFIRM_TEXT_VALUE}" to start deletion`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          variant="outlined"
          fullWidth
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleDelete} disabled={deletionDisabled} color="primary">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};
