import React from "react";
import z from "zod";
import { useStore } from "@tanstack/react-form";
import { useAppForm } from "@/core/components/form";
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
import { PIPELINERUN_VIEW_ERROR_MESSAGES, PIPELINERUN_VIEW_NAME_MAX_LENGTH } from "../../constants";
import { isPipelineRunViewNameTaken } from "../../hooks/usePipelineRunViews";
import type { PipelineRunViewNameDialogProps } from "./types";

const DIALOG_TEXT = {
  create: {
    title: "Add view",
    description: "Save the current filters as a view.",
    submit: "Add view",
  },
  rename: {
    title: "Edit view",
    description: "To change the filters, edit them on the page and use Save changes.",
    submit: "Save",
  },
} as const;

export const PipelineRunViewNameDialog: React.FC<PipelineRunViewNameDialogProps> = ({
  props: { mode, views, view, onSubmit },
  state: { open, closeDialog },
}) => {
  const [submitError, setSubmitError] = React.useState<string>();

  const schema = React.useMemo(
    () =>
      z.object({
        name: z
          .string()
          .trim()
          .min(1, "Enter a name.")
          .max(PIPELINERUN_VIEW_NAME_MAX_LENGTH, `Use ${PIPELINERUN_VIEW_NAME_MAX_LENGTH} characters or fewer.`)
          .refine((name) => !isPipelineRunViewNameTaken(views, name, view?.id), {
            message: PIPELINERUN_VIEW_ERROR_MESSAGES["duplicate-name"],
          }),
      }),
    [views, view?.id]
  );

  const form = useAppForm({
    defaultValues: { name: view?.name ?? "" },
    validators: { onChange: schema, onSubmit: schema },
    onSubmit: async ({ value }) => {
      const result = onSubmit(value.name);
      if (!result.ok) {
        setSubmitError(PIPELINERUN_VIEW_ERROR_MESSAGES[result.error]);
        return;
      }
      closeDialog();
    },
  });

  const canSubmit = useStore(form.store, (state) => state.canSubmit);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(undefined);
    void form.handleSubmit();
  };

  const text = DIALOG_TEXT[mode];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && closeDialog()}>
      <DialogContent className="w-full max-w-lg">
        <DialogHeader>
          <DialogTitle>{text.title}</DialogTitle>
          <DialogDescription>{text.description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody>
            <div className="flex flex-col gap-2">
              <form.AppField name="name">
                {(field) => (
                  <field.FormTextField
                    label="Name"
                    placeholder="My projects"
                    inputProps={{ autoFocus: true, maxLength: PIPELINERUN_VIEW_NAME_MAX_LENGTH }}
                  />
                )}
              </form.AppField>
              {submitError && (
                <p role="alert" className="text-destructive text-sm">
                  {submitError}
                </p>
              )}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={closeDialog}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {text.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

PipelineRunViewNameDialog.displayName = "PipelineRunViewNameDialog";
