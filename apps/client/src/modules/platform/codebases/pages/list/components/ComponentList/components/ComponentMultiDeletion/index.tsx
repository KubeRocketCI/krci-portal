import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
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
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="w-full max-w-xl">
        <DialogHeader>
          <DialogTitle>Are you sure you want to delete {selected.length} selected component(s)?</DialogTitle>
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
