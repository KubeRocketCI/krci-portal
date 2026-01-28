import { Button } from "@/core/components/ui/button";
import React from "react";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { DIALOG_NAME } from "./constants";
import { ConfirmResourcesUpdatesDialogProps } from "./types";
import { k8sOperation } from "@my-project/shared";

export const ConfirmResourcesUpdatesDialog: React.FC<ConfirmResourcesUpdatesDialogProps> = ({ props, state }) => {
  const { deleteCallback, text, resourcesArray } = props;
  const { closeDialog, open } = state;
  const [confirmValue, setConfirmValue] = React.useState("");

  const isSubmitNotAllowed = confirmValue !== "confirm";

  const handleClosePopup = React.useCallback(() => {
    closeDialog();
    setConfirmValue("");
  }, [closeDialog]);

  const onSubmit = React.useCallback(async () => {
    await deleteCallback();
    handleClosePopup();
  }, [deleteCallback, handleClosePopup]);

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
                                : actionType === k8sOperation.delete
                                  ? "deleted"
                                  : actionType === k8sOperation.create
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
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirm-input">Enter &quot;confirm&quot; to confirm action</Label>
              <Input
                id="confirm-input"
                value={confirmValue}
                onChange={(e) => setConfirmValue(e.target.value)}
                placeholder=""
              />
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button type="button" onClick={handleClosePopup} variant="ghost">
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
