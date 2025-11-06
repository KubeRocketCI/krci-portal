import { Button } from "@/core/components/ui/button";
import React from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";
import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { DIALOG_NAME } from "./constants";
import { ConfirmDialogProps } from "./types";

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  props: { actionCallback, text },
  state: { open, closeDialog },
}) => {
  const {
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm();

  const confirmFieldValue = watch("confirm");
  const isSubmitNotAllowed = confirmFieldValue !== "confirm";

  const handleClosePopup = React.useCallback(() => closeDialog(), [closeDialog]);

  const onSubmit = React.useCallback(async () => {
    await actionCallback();
    handleClosePopup();
    reset();
  }, [actionCallback, handleClosePopup, reset]);

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClosePopup()} data-testid="dialog">
      <DialogContent className="w-full max-w-4xl">
        <DialogHeader>
          <DialogTitle>Confirm action</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col gap-4">
            {!!text && (
              <div>
                <p className="text-lg">{text}</p>
              </div>
            )}
            <FormTextField
              name="confirm"
              control={control}
              errors={errors}
              label={'Enter "confirm" to confirm action'}
              rules={{ required: true }}
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={handleClosePopup}>
            Cancel
          </Button>
          <Button variant="default" onClick={onSubmit} disabled={isSubmitNotAllowed}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

ConfirmDialog.displayName = DIALOG_NAME;
