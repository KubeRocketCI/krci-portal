import { Dialog, DialogContent } from "@/core/components/ui/dialog";
import React from "react";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { ErrorContent } from "@/core/components/ErrorContent";
import { useCodebaseBranchWatchItem } from "@/k8s/api/groups/KRCI/CodebaseBranch";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
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
      <DialogContent className="w-full max-w-4xl">
        <LoadingWrapper isLoading={branchWatch.query.isLoading}>
          <EditCodebaseBranchForm codebaseBranch={codebaseBranch} isProtected={isProtected} onClose={closeDialog} />
        </LoadingWrapper>
      </DialogContent>
    </Dialog>
  );
};

EditCodebaseBranchDialog.displayName = dialogName;
