import React from "react";
import { DialogBody, DialogFooter, DialogHeader } from "@/core/components/ui/dialog";
import { DialogHeader as CustomDialogHeader } from "./components/DialogHeader";
import { Form } from "./components/Form";
import { FormActions } from "./components/FormActions";
import { useDefaultValues } from "./hooks/useDefaultValues";
import { CodebaseBranchFormProvider } from "../../providers/form/provider";
import type { ManageCodebaseBranchFormValues } from "../../types";
import { useCodebaseBranchCRUD } from "@/k8s/api/groups/KRCI/CodebaseBranch";
import {
  createCodebaseBranchDraftObject,
  createVersioningString,
  editDefaultCodebaseBranchObject,
} from "@my-project/shared";
import { useCurrentDialog } from "../../providers/CurrentDialog/hooks";
import { Alert } from "@/core/components/ui/alert";
import type { RequestError } from "@/core/types/global";
import { getK8sErrorMessage } from "@/k8s/api/utils/getK8sErrorMessage";

export const Create = () => {
  const baseDefaultValues = useDefaultValues();
  const {
    props: { codebase, defaultBranch, codebaseBranches },
    state: { closeDialog },
  } = useCurrentDialog();

  const { triggerCreateCodebaseBranch, mutations } = useCodebaseBranchCRUD();
  const { codebaseBranchCreateMutation, codebaseBranchEditMutation } = mutations;

  const handleSubmit = React.useCallback(
    async (formValues: ManageCodebaseBranchFormValues) => {
      const newDefaultBranchVersion = createVersioningString(
        formValues.defaultBranchVersionStart,
        formValues.defaultBranchVersionPostfix
      );

      const newCodebaseBranch = createCodebaseBranchDraftObject({
        branchName: formValues.branchName,
        fromCommit: formValues.fromCommit,
        release: formValues.release,
        codebase: codebase.metadata.name,
        pipelines: {
          build: formValues.buildPipeline,
          review: formValues.reviewPipeline,
          ...(formValues.securityPipeline && { security: formValues.securityPipeline }),
        },
        version: formValues.version,
      });

      if (formValues.release) {
        const newDefaultCodebaseBranch = editDefaultCodebaseBranchObject(defaultBranch, {
          version: newDefaultBranchVersion,
        });

        await triggerCreateCodebaseBranch({
          data: {
            codebaseBranch: newCodebaseBranch,
            defaultCodebaseBranch: newDefaultCodebaseBranch,
          },
          callbacks: {
            onSuccess: () => {
              closeDialog();
            },
            onError: () => {
              // Error is available via mutation.error
            },
          },
        });
      } else {
        await triggerCreateCodebaseBranch({
          data: {
            codebaseBranch: newCodebaseBranch,
          },
          callbacks: {
            onSuccess: () => {
              closeDialog();
            },
            onError: () => {
              // Error is available via mutation.error
            },
          },
        });
      }
    },
    [codebase.metadata.name, closeDialog, defaultBranch, triggerCreateCodebaseBranch]
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSubmitError = React.useCallback((_error: unknown) => {
    // Errors are handled by displaying mutation error in the dialog
    // No need to show toast here
  }, []);

  const validationContext = React.useMemo(
    () => ({
      existingBranchNames: codebaseBranches.map((branch) => branch.spec.branchName),
    }),
    [codebaseBranches]
  );

  // Get request error from mutations - check both create and edit mutations since edit might be called for release branches
  const requestError = (codebaseBranchCreateMutation.error || codebaseBranchEditMutation.error) as RequestError | null;

  return (
    <CodebaseBranchFormProvider
      defaultValues={baseDefaultValues}
      validationContext={validationContext}
      onSubmit={handleSubmit}
      onSubmitError={handleSubmitError}
    >
      <DialogHeader>
        <CustomDialogHeader />
      </DialogHeader>
      <DialogBody>
        <div className="flex flex-col gap-4">
          {requestError && (
            <Alert variant="destructive" title="Failed to create codebase branch">
              {getK8sErrorMessage(requestError)}
            </Alert>
          )}
          <Form />
        </div>
      </DialogBody>
      <DialogFooter>
        <FormActions />
      </DialogFooter>
    </CodebaseBranchFormProvider>
  );
};
