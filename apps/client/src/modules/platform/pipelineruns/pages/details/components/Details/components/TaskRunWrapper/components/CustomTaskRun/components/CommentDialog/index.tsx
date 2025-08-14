import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
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
    <Dialog open={open} onClose={closeDialog} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
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
      </DialogContent>
      <DialogActions>
        <Button onClick={closeDialog}>Cancel</Button>
        <Button onClick={handleSubmit(onSubmit)}>Confirm</Button>
      </DialogActions>
    </Dialog>
  );
};

CommentDialog.displayName = DIALOG_NAME;
