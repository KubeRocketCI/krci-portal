import React from "react";
import { DialogBody, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import { useCodebaseCRUD } from "@/k8s/api/groups/KRCI/Codebase";
import { codebaseType, editCodebaseObject } from "@my-project/shared";
import type { Codebase } from "@my-project/shared";
import { useDefaultValues } from "./hooks/useDefaultValues";
import { FormContent } from "./components/FormContent";
import { FormActions } from "./components/FormActions";
import { EditCodebaseFormValues, EDIT_CODEBASE_FORM_NAMES } from "./types";
import { EditCodebaseFormProvider } from "./providers/form/provider";
import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { Alert } from "@/core/components/ui/alert";
import type { RequestError } from "@/core/types/global";
import { getK8sErrorMessage } from "@/k8s/api/utils/getK8sErrorMessage";

export interface EditCodebaseFormProps {
  codebase: Codebase;
  onClose: () => void;
  isProtected?: boolean;
}

export const EditCodebaseForm: React.FC<EditCodebaseFormProps> = ({ codebase, onClose, isProtected }) => {
  const defaultValues = useDefaultValues(codebase);
  const { triggerPatchCodebase, mutations } = useCodebaseCRUD();
  const { codebasePatchMutation } = mutations;

  const handleSubmit = React.useCallback(
    async (values: EditCodebaseFormValues) => {
      if (!codebase) return;

      const hasJiraServerIntegration = values[EDIT_CODEBASE_FORM_NAMES.hasJiraServerIntegration];
      const commitMessagePattern = values[EDIT_CODEBASE_FORM_NAMES.commitMessagePattern];
      const jiraServer = hasJiraServerIntegration ? values[EDIT_CODEBASE_FORM_NAMES.jiraServer] : null;
      const ticketNamePattern = hasJiraServerIntegration ? values[EDIT_CODEBASE_FORM_NAMES.ticketNamePattern] : null;
      const jiraIssueMetadataPayload = hasJiraServerIntegration
        ? values[EDIT_CODEBASE_FORM_NAMES.jiraIssueMetadataPayload]
        : null;

      const updatedCodebase = editCodebaseObject(codebase, {
        jiraServer,
        commitMessagePattern,
        ticketNamePattern,
        jiraIssueMetadataPayload,
      });

      await triggerPatchCodebase({
        data: { codebase: updatedCodebase },
        callbacks: { onSuccess: onClose },
      });
    },
    [codebase, triggerPatchCodebase, onClose]
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onSubmitError = React.useCallback((_error: unknown) => {}, []);

  const requestError = codebasePatchMutation.error as RequestError | null;

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

  return (
    <EditCodebaseFormProvider defaultValues={defaultValues} onSubmit={handleSubmit} onSubmitError={onSubmitError}>
      <DialogHeader>
        <div className="flex flex-row items-start justify-between gap-2">
          <div className="flex flex-col gap-4">
            <DialogTitle>{`Edit ${codebase?.metadata.name}`}</DialogTitle>
            <LearnMoreLink url={docLink} />
          </div>
        </div>
      </DialogHeader>
      <DialogBody>
        <div className="flex flex-col gap-4">
          {requestError && (
            <Alert variant="destructive" title="Failed to update codebase">
              {getK8sErrorMessage(requestError)}
            </Alert>
          )}
          <FormContent />
        </div>
      </DialogBody>
      <DialogFooter>
        <FormActions onClose={onClose} isProtected={isProtected} />
      </DialogFooter>
    </EditCodebaseFormProvider>
  );
};
