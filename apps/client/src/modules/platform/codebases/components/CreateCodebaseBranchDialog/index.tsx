import { Dialog, DialogContent } from "@/core/components/ui/dialog";
import React from "react";
import type { CreateCodebaseBranchDialogProps } from "./types";
import { CreateCodebaseBranchForm } from "../CreateCodebaseBranchForm";

const dialogName = "CREATE_CODEBASE_BRANCH";

export const CreateCodebaseBranchDialog: React.FC<CreateCodebaseBranchDialogProps> = ({ props, state }) => {
  const { codebase, codebaseBranches, defaultBranch, pipelines } = props;
  const { open, closeDialog } = state;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && closeDialog()} data-testid="dialog">
      <DialogContent className="w-full max-w-4xl">
        <CreateCodebaseBranchForm
          codebase={codebase}
          codebaseBranches={codebaseBranches}
          defaultBranch={defaultBranch}
          pipelines={pipelines}
          onClose={closeDialog}
        />
      </DialogContent>
    </Dialog>
  );
};

CreateCodebaseBranchDialog.displayName = dialogName;
