import { Dialog, DialogContent } from "@/core/components/ui/dialog";
import React from "react";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { ErrorContent } from "@/core/components/ErrorContent";
import { useCodebaseWatchItem } from "@/k8s/api/groups/KRCI/Codebase";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import type { EditCodebaseDialogProps } from "./types";
import { EditCodebaseForm } from "../EditCodebaseForm";

const dialogName = "EDIT_CODEBASE_DIALOG";

export const EditCodebaseDialog: React.FC<EditCodebaseDialogProps> = ({ props, state }) => {
  const { codebase: codebaseProp, isProtected } = props;
  const { open, closeDialog } = state;

  const { defaultNamespace } = useClusterStore(useShallow((state) => ({ defaultNamespace: state.defaultNamespace })));

  const codebaseWatch = useCodebaseWatchItem({
    name: codebaseProp.metadata.name,
    namespace: codebaseProp.metadata.namespace || defaultNamespace,
    queryOptions: {
      enabled: !!codebaseProp.metadata.name && !!(codebaseProp.metadata.namespace || defaultNamespace),
    },
  });

  const codebase = codebaseWatch.query.data || codebaseProp;

  if (codebaseWatch.query.error) {
    return (
      <Dialog open={open} onOpenChange={(open) => !open && closeDialog()} data-testid="dialog">
        <DialogContent className="w-full max-w-4xl">
          <ErrorContent error={codebaseWatch.query.error} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && closeDialog()} data-testid="dialog">
      <DialogContent className="w-full max-w-4xl">
        <LoadingWrapper isLoading={codebaseWatch.query.isLoading}>
          <EditCodebaseForm codebase={codebase} onClose={closeDialog} isProtected={isProtected} />
        </LoadingWrapper>
      </DialogContent>
    </Dialog>
  );
};

EditCodebaseDialog.displayName = dialogName;
