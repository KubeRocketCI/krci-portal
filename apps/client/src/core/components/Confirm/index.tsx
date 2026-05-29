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
  const [isPending, setIsPending] = React.useState(false);

  // Disable Confirm both before the user has typed the magic word AND while the
  // callback is in-flight, so rapid double-clicks cannot fire the action twice.
  const isSubmitNotAllowed = confirmValue !== "confirm" || isPending;

  const handleClosePopup = React.useCallback(() => {
    closeDialog();
    setConfirmValue("");
  }, [closeDialog]);

  const onSubmit = React.useCallback(async () => {
    if (isPending) return;
    setIsPending(true);
    try {
      await actionCallback();
      handleClosePopup();
    } finally {
      setIsPending(false);
    }
  }, [actionCallback, handleClosePopup, isPending]);

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
          <Button variant="default" onClick={onSubmit} disabled={isSubmitNotAllowed} aria-busy={isPending}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

ConfirmDialog.displayName = DIALOG_NAME;
