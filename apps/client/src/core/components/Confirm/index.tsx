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
import { ConfirmDialogProps } from "./types";

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  props: { actionCallback, text },
  state: { open, closeDialog },
}) => {
  const [confirmValue, setConfirmValue] = React.useState("");

  const isSubmitNotAllowed = confirmValue !== "confirm";

  const handleClosePopup = React.useCallback(() => {
    closeDialog();
    setConfirmValue("");
  }, [closeDialog]);

  const onSubmit = React.useCallback(async () => {
    await actionCallback();
    handleClosePopup();
  }, [actionCallback, handleClosePopup]);

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
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirm-input">Enter "confirm" to confirm action</Label>
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
