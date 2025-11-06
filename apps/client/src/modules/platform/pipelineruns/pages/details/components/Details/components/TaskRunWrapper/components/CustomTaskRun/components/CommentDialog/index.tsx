import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import { Button } from "@/core/components/ui/button";
import React from "react";
import { useForm } from "react-hook-form";
import { DIALOG_NAME } from "./constants";
import { CommentDialogProps } from "./types";
import { ValueOf } from "@/core/types/global";
import { FormTextField } from "@/core/providers/Form/components/FormTextField";

const names = {
  COMMENT: "comment",
};

type FormValues = Record<ValueOf<typeof names>, string>;

export const CommentDialog: React.FC<CommentDialogProps> = ({
  props: { onFormSubmit, title },
  state: { open, closeDialog },
}) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>();

  const onSubmit = (values: FormValues) => {
    onFormSubmit(values.comment);
    closeDialog();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="max-w-2xl w-full">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FormTextField
              {...register(names.COMMENT, {
                required: "Enter a comment.",
              })}
              placeholder={"Enter a comment"}
              label={"Comment"}
              control={control}
              errors={errors}
            />
          </form>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={closeDialog}>Cancel</Button>
          <Button variant="default" onClick={handleSubmit(onSubmit)}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

CommentDialog.displayName = DIALOG_NAME;
