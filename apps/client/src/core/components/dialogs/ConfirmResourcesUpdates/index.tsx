import { Button } from "@/core/components/ui/button";
import React from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { DIALOG_NAME } from "./constants";
import { ConfirmResourcesUpdatesDialogProps } from "./types";
import { k8sOperation } from "@my-project/shared";

export const ConfirmResourcesUpdatesDialog: React.FC<ConfirmResourcesUpdatesDialogProps> = ({ props, state }) => {
  const { deleteCallback, text, resourcesArray } = props;
  const { closeDialog, open } = state;
  const { control, watch, reset, formState: { errors } } = useForm();

  const confirmFieldValue = watch("confirm");
  const isSubmitNotAllowed = confirmFieldValue !== "confirm";

  const handleClosePopup = React.useCallback(() => closeDialog(), [closeDialog]);

  const onSubmit = React.useCallback(async () => {
    await deleteCallback();
    handleClosePopup();
    reset();
  }, [deleteCallback, handleClosePopup, reset]);

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
            {!!resourcesArray && (
              <div>
                <div className="flex flex-col gap-2">
                  {resourcesArray
                    ? resourcesArray.map(({ name, kind, actionType }) => {
                        return (
                          <div key={name}>
                            <span className="mr-1 text-sm italic">{kind}</span>
                            <span className="mr-1 text-sm font-bold">{name}</span>
                            <span className="text-sm">
                              will be{" "}
                              {actionType === k8sOperation.patch
                                ? "updated"
                                : k8sOperation.delete
                                  ? "deleted"
                                  : k8sOperation.create
                                    ? "created"
                                    : ""}
                            </span>
                          </div>
                        );
                      })
                    : null}
                </div>
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
          <Button type={"button"} onClick={handleClosePopup} variant="ghost">
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitNotAllowed}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

ConfirmResourcesUpdatesDialog.displayName = DIALOG_NAME;
