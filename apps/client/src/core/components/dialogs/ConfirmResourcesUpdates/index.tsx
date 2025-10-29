import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import React from "react";
import { useForm } from "react-hook-form";
import { DIALOG_NAME } from "./constants";
import { ConfirmResourcesUpdatesDialogProps } from "./types";
import { k8sOperation } from "@my-project/shared";

export const ConfirmResourcesUpdatesDialog: React.FC<ConfirmResourcesUpdatesDialogProps> = ({ props, state }) => {
  const { deleteCallback, text, resourcesArray } = props;
  const { closeDialog, open } = state;
  const { register, watch, reset } = useForm();

  const confirmFieldValue = watch("confirm");
  const isSubmitNotAllowed = confirmFieldValue !== "confirm";

  const handleClosePopup = React.useCallback(() => closeDialog(), [closeDialog]);

  const onSubmit = React.useCallback(async () => {
    await deleteCallback();
    handleClosePopup();
    reset();
  }, [deleteCallback, handleClosePopup, reset]);

  return (
    <Dialog open={open} onClose={handleClosePopup} fullWidth data-testid="dialog">
      <DialogTitle>Confirm action</DialogTitle>
      <DialogContent>
        <div className="mb-10">
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
                            <span
                              className="text-sm italic mr-1"
                            >
                              {kind}
                            </span>
                            <span
                              className="text-sm font-bold mr-1"
                            >
                              {name}
                            </span>
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
            <div>
              <TextField
                {...register("confirm", { required: true })}
                label={'Enter "confirm" to confirm action'}
                variant="outlined"
                fullWidth
              />
            </div>
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <Button type={"button"} onClick={handleClosePopup}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={isSubmitNotAllowed}>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ConfirmResourcesUpdatesDialog.displayName = DIALOG_NAME;
