import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";
import { Button } from "@/core/components/ui/button";
import React from "react";
import { useAppForm } from "@/core/components/form";
import { DIALOG_NAME } from "./constants";
import { CommentDialogProps } from "./types";

export const CommentDialog: React.FC<CommentDialogProps> = ({
  props: { onFormSubmit, title },
  state: { open, closeDialog },
}) => {
  const form = useAppForm({
    defaultValues: { comment: "" },
    validators: {
      onChange: ({ value }: { value: { comment: string } }) => {
        if (!value.comment?.trim()) {
          return "Enter a comment.";
        }
        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      onFormSubmit(value.comment);
      closeDialog();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void form.handleSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="w-full max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <form onSubmit={handleSubmit}>
            <form.AppField name="comment">
              {(field) => <field.FormTextField placeholder="Enter a comment" label="Comment" />}
            </form.AppField>
          </form>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={closeDialog}>
            Cancel
          </Button>
          <Button type="submit" variant="default">
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

CommentDialog.displayName = DIALOG_NAME;
