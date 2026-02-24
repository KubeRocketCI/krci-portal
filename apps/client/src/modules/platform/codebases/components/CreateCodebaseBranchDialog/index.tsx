import { Dialog } from "@/core/components/ui/dialog";
import React from "react";
import { FormGuideProvider } from "@/core/providers/FormGuide/provider";
import { FormGuideDialogContent } from "@/core/components/FormGuide";
import { FORM_GUIDE_CONFIG } from "../CreateCodebaseBranchForm/constants";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import type { CreateCodebaseBranchDialogProps } from "./types";
import { CreateCodebaseBranchForm } from "../CreateCodebaseBranchForm";

const dialogName = "CREATE_CODEBASE_BRANCH";

export const CreateCodebaseBranchDialog: React.FC<CreateCodebaseBranchDialogProps> = ({ props, state }) => {
  const { codebase, codebaseBranches, defaultBranch, pipelines } = props;
  const { open, closeDialog } = state;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && closeDialog()} data-testid="dialog">
      <FormGuideProvider
        config={FORM_GUIDE_CONFIG}
        steps={[]}
        currentStepIdx={0}
        docUrl={EDP_USER_GUIDE.BRANCHES_MANAGE.anchors.ADD_BRANCH.url}
      >
        <FormGuideDialogContent>
          <CreateCodebaseBranchForm
            codebase={codebase}
            codebaseBranches={codebaseBranches}
            defaultBranch={defaultBranch}
            pipelines={pipelines}
            onClose={closeDialog}
          />
        </FormGuideDialogContent>
      </FormGuideProvider>
    </Dialog>
  );
};

CreateCodebaseBranchDialog.displayName = dialogName;
