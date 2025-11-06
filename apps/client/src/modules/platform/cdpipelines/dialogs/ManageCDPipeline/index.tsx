import { Dialog, DialogContent } from "@/core/components/ui/dialog";
import React from "react";
import { Create } from "./components/Create";
import { Edit } from "./components/Edit";
import { DIALOG_NAME } from "./constants";
import { CurrentDialogContextProvider } from "./providers/CurrentDialog/provider";
import { ManageCDPipelineDialogProps } from "./types";
import { FORM_MODES } from "@/core/types/forms";

export const ManageCDPipelineDialog: React.FC<ManageCDPipelineDialogProps> = ({ props, state }) => {
  const { CDPipeline } = props;
  const { open, closeDialog } = state;

  const mode = CDPipeline ? FORM_MODES.EDIT : FORM_MODES.CREATE;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && closeDialog()} data-testid="dialog">
      <DialogContent className="w-full max-w-4xl">
        <CurrentDialogContextProvider props={props} state={state}>
          {mode === FORM_MODES.CREATE ? <Create /> : mode === FORM_MODES.EDIT ? <Edit /> : null}
        </CurrentDialogContextProvider>
      </DialogContent>
    </Dialog>
  );
};

ManageCDPipelineDialog.displayName = DIALOG_NAME;
