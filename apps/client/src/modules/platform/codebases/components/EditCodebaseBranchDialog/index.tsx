import { Dialog, DialogContent } from "@/core/components/ui/dialog";
import React from "react";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { ErrorContent } from "@/core/components/ErrorContent";
import { useCodebaseBranchWatchItem } from "@/k8s/api/groups/KRCI/CodebaseBranch";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { FormGuideProvider } from "@/core/providers/FormGuide/provider";
import { FormGuideDialogContent } from "@/core/components/FormGuide";
import { FORM_GUIDE_CONFIG } from "../EditCodebaseBranchForm/constants";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import type { EditCodebaseBranchDialogProps } from "./types";
import { EditCodebaseBranchForm } from "../EditCodebaseBranchForm";

const dialogName = "EDIT_CODEBASE_BRANCH";

export const EditCodebaseBranchDialog: React.FC<EditCodebaseBranchDialogProps> = ({ props, state }) => {
  const { codebaseBranch: codebaseBranchProp, isProtected } = props;
  const { open, closeDialog } = state;

  const { defaultNamespace } = useClusterStore(useShallow((state) => ({ defaultNamespace: state.defaultNamespace })));

  const branchWatch = useCodebaseBranchWatchItem({
    name: codebaseBranchProp.metadata.name,
    namespace: codebaseBranchProp.metadata.namespace || defaultNamespace,
    queryOptions: {
      enabled: !!codebaseBranchProp.metadata.name && !!(codebaseBranchProp.metadata.namespace || defaultNamespace),
    },
  });

  const codebaseBranch = branchWatch.query.data || codebaseBranchProp;

  if (branchWatch.query.error) {
    return (
      <Dialog open={open} onOpenChange={(open) => !open && closeDialog()} data-testid="dialog">
        <DialogContent className="w-full max-w-4xl">
          <ErrorContent error={branchWatch.query.error} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && closeDialog()} data-testid="dialog">
      <FormGuideProvider
        config={FORM_GUIDE_CONFIG}
        steps={[]}
        currentStepIdx={0}
        docUrl={EDP_USER_GUIDE.BRANCHES_MANAGE.url}
      >
        <FormGuideDialogContent>
          <LoadingWrapper isLoading={branchWatch.query.isLoading}>
            <EditCodebaseBranchForm codebaseBranch={codebaseBranch} isProtected={isProtected} onClose={closeDialog} />
          </LoadingWrapper>
        </FormGuideDialogContent>
      </FormGuideProvider>
    </Dialog>
  );
};

EditCodebaseBranchDialog.displayName = dialogName;
