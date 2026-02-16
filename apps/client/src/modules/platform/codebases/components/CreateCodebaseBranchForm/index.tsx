import React from "react";
import { DialogBody, DialogFooter, DialogHeader } from "@/core/components/ui/dialog";
import { DialogHeader as CustomDialogHeader } from "./components/DialogHeader";
import { Form } from "./components/Form";
import { FormActions } from "./components/FormActions";
import { useDefaultValues } from "./hooks/useDefaultValues";
import { CreateCodebaseBranchFormProvider } from "./providers/form/provider";
import type { CreateCodebaseBranchFormValues } from "./types";
import type { Codebase, CodebaseBranch } from "@my-project/shared";
import { useCodebaseBranchCRUD } from "@/k8s/api/groups/KRCI/CodebaseBranch";
import {
  createCodebaseBranchDraftObject,
  createVersioningString,
  editDefaultCodebaseBranchObject,
} from "@my-project/shared";
import { Alert } from "@/core/components/ui/alert";
import type { RequestError } from "@/core/types/global";
import { getK8sErrorMessage } from "@/k8s/api/utils/getK8sErrorMessage";

export interface CreateCodebaseBranchFormProps {
  codebase: Codebase;
  codebaseBranches: CodebaseBranch[];
  defaultBranch: CodebaseBranch;
  pipelines: {
    review?: string;
    build?: string;
    security?: string;
  };
  onClose: () => void;
}

export const CreateCodebaseBranchForm: React.FC<CreateCodebaseBranchFormProps> = ({
  codebase,
  codebaseBranches,
  defaultBranch,
  pipelines,
  onClose,
}) => {
  const baseDefaultValues = useDefaultValues({ codebase, defaultBranch, pipelines });

  const { triggerCreateCodebaseBranch, mutations } = useCodebaseBranchCRUD();
  const { codebaseBranchCreateMutation, codebaseBranchEditMutation } = mutations;

  const handleSubmit = React.useCallback(
    async (formValues: CreateCodebaseBranchFormValues) => {
      const newDefaultBranchVersion = createVersioningString(
        formValues.defaultBranchVersionStart,
        formValues.defaultBranchVersionPostfix
      );

      const newCodebaseBranch = createCodebaseBranchDraftObject({
        branchName: formValues.branchName,
        releaseBranchName: formValues.releaseBranchName,
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
            onSuccess: onClose,
          },
        });
      } else {
        await triggerCreateCodebaseBranch({
          data: {
            codebaseBranch: newCodebaseBranch,
          },
          callbacks: {
            onSuccess: onClose,
          },
        });
      }
    },
    [codebase.metadata.name, onClose, defaultBranch, triggerCreateCodebaseBranch]
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSubmitError = React.useCallback((_error: unknown) => {}, []);

  const validationContext = React.useMemo(
    () => ({
      existingBranchNames: codebaseBranches.map((branch) => branch.spec.branchName),
    }),
    [codebaseBranches]
  );

  const requestError = (codebaseBranchCreateMutation.error || codebaseBranchEditMutation.error) as RequestError | null;

  return (
    <CreateCodebaseBranchFormProvider
      defaultValues={baseDefaultValues}
      validationContext={validationContext}
      onSubmit={handleSubmit}
      onSubmitError={handleSubmitError}
    >
      <DialogHeader>
        <CustomDialogHeader codebaseName={codebase.metadata.name} />
      </DialogHeader>
      <DialogBody>
        <div className="flex flex-col gap-4">
          {requestError && (
            <Alert variant="destructive" title="Failed to create codebase branch">
              {getK8sErrorMessage(requestError)}
            </Alert>
          )}
          <Form codebase={codebase} defaultBranch={defaultBranch} pipelines={pipelines} />
        </div>
      </DialogBody>
      <DialogFooter>
        <FormActions onClose={onClose} />
      </DialogFooter>
    </CreateCodebaseBranchFormProvider>
  );
};
