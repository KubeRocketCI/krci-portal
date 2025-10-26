import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import React from "react";
import { useResourceCRUDMutation } from "@/k8s/api/hooks/useResourceCRUDMutation";
import { k8sCodebaseConfig, k8sOperation, Codebase } from "@my-project/shared";
import { ComponentMultiDeletionProps } from "./types";

const CONFIRM_TEXT_VALUE = "confirm";

export const ComponentMultiDeletion = ({
  components,
  open,
  handleClose,
  selected,
  onDelete,
}: ComponentMultiDeletionProps) => {
  const [value, setValue] = React.useState("");

  const codebaseDeleteMutation = useResourceCRUDMutation<Codebase, typeof k8sOperation.delete>(
    "codebaseMultiDeleteMutation",
    k8sOperation.delete
  );

  const deletionDisabled = value !== CONFIRM_TEXT_VALUE;

  const handleDelete = () => {
    if (deletionDisabled) {
      return;
    }

    const componentsToDelete = components.filter((component) => selected.includes(component.metadata.name));

    componentsToDelete.forEach((component) => {
      codebaseDeleteMutation.mutate({
        resource: component,
        resourceConfig: k8sCodebaseConfig,
      });
    });

    setValue("");
    onDelete();
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Are you sure you want to delete {selected.length} selected component(s)?</DialogTitle>
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
