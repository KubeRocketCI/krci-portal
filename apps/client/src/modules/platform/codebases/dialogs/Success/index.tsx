import { Button } from "@/core/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";
import React from "react";
import { DIALOG_NAME } from "./constants";
import { SuccessGraphDialogProps } from "./types";
import { Link } from "@tanstack/react-router";
import { PartyPopper } from "lucide-react";

export const SuccessDialog: React.FC<SuccessGraphDialogProps> = ({
  props: { dialogTitle, title, description, route },
  state: { closeDialog, open },
}) => {
  return (
    <Dialog open={open} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="w-full max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium">{dialogTitle}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col items-center gap-2">
            <PartyPopper size={128} color="#A2A7B7" />
            {title && <h3 className="text-foreground text-xl font-medium">{title}</h3>}
            {description && <p className="text-muted-foreground text-sm">{description}</p>}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button onClick={() => closeDialog()} variant="ghost">
            Close
          </Button>
          {route && (
            <Link
              to={route.to}
              params={route.params}
              search={route.search}
              onClick={() => closeDialog()}
              className="no-underline"
            >
              <Button variant="default">Proceed</Button>
            </Link>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

SuccessDialog.displayName = DIALOG_NAME;
