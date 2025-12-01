import { Dialog, DialogContent, DialogBody, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import React from "react";
import { FormContextProvider } from "@/core/providers/Form/provider";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { ErrorContent } from "@/core/components/ErrorContent";
import { useCodebaseWatchItem } from "@/k8s/api/groups/KRCI/Codebase";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { useDefaultValues } from "./hooks/useDefaultValues";
import { FormContent } from "./components/FormContent";
import { FormActions } from "./components/FormActions";
import { EditCodebaseDialogProps } from "./types";
import { dialogName } from "./constants";
import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { codebaseType } from "@my-project/shared";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";

export const EditCodebaseDialog: React.FC<EditCodebaseDialogProps> = ({ props, state }) => {
  const { codebase: codebaseProp } = props;
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
  const defaultValues = useDefaultValues(codebase);

  const docLink = React.useMemo(() => {
    switch (codebase?.spec.type) {
      case codebaseType.application:
        return EDP_USER_GUIDE.APPLICATION_CREATE.url;
      case codebaseType.autotest:
        return EDP_USER_GUIDE.AUTOTEST_CREATE.url;
      case codebaseType.library:
        return EDP_USER_GUIDE.LIBRARY_CREATE.url;
      case codebaseType.infrastructure:
        return EDP_USER_GUIDE.INFRASTRUCTURE_CREATE.url;
      default:
        return EDP_USER_GUIDE.APPLICATION_CREATE.url;
    }
  }, [codebase]);

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
          <FormContextProvider
            formSettings={{
              mode: "onBlur",
              defaultValues,
            }}
          >
            <DialogHeader>
              <div className="flex flex-row items-start justify-between gap-2">
                <div className="flex flex-col gap-4">
                  <DialogTitle>{`Edit ${codebase?.metadata.name}`}</DialogTitle>
                  <LearnMoreLink url={docLink} />
                </div>
              </div>
            </DialogHeader>
            <DialogBody>
              <FormContent />
            </DialogBody>
            <DialogFooter>
              <FormActions codebase={codebase} />
            </DialogFooter>
          </FormContextProvider>
        </LoadingWrapper>
      </DialogContent>
    </Dialog>
  );
};

EditCodebaseDialog.displayName = dialogName;

