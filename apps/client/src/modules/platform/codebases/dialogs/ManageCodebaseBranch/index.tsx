import { Dialog, DialogContent } from "@/core/components/ui/dialog";
import React from "react";
import { Create } from "./components/Create";
import { Edit } from "./components/Edit";
import { DIALOG_NAME } from "./constants";
import { CurrentDialogContextProvider } from "./providers/CurrentDialog/provider";
import { ManageCodebaseBranchDialogProps } from "./types";
import { FORM_MODES } from "@/core/types/forms";

export const ManageCodebaseBranchDialog: React.FC<ManageCodebaseBranchDialogProps> = (props) => {
  const {
    props: { codebaseBranch },
    state: { open, closeDialog },
  } = props;

  const mode = codebaseBranch ? FORM_MODES.EDIT : FORM_MODES.CREATE;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && closeDialog()} data-testid="dialog">
      <DialogContent className="w-full max-w-4xl">
        <CurrentDialogContextProvider {...props}>
          {mode === FORM_MODES.CREATE ? <Create /> : mode === FORM_MODES.EDIT ? <Edit /> : null}
        </CurrentDialogContextProvider>
      </DialogContent>
    </Dialog>
  );
};

ManageCodebaseBranchDialog.displayName = DIALOG_NAME;
