import React from "react";
import { DialogBody, DialogFooter, DialogHeader } from "@/core/components/ui/dialog";
import { DialogHeader as CustomDialogHeader } from "./components/DialogHeader";
import { Form } from "./components/Form";
import { FormActions } from "./components/FormActions";
import { useDefaultValues } from "./hooks/useDefaultValues";
import { CreateCodebaseBranchFormProvider } from "./providers/form/provider";
import { FormGuidePanel } from "@/core/components/FormGuide";
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
import { useMutation } from "@tanstack/react-query";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";

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

  const trpc = useTRPCClient();
  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );

  const invalidateBranchListCacheMutation = useMutation({
    mutationFn: () =>
      trpc.gitfusion.invalidateBranchListCache.mutate({
        namespace: defaultNamespace,
        clusterName,
      }),
  });

  React.useEffect(() => {
    invalidateBranchListCacheMutation.mutate();
    // Run once on mount (dialog open) to ensure fresh branch list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      const handleSuccess = () => {
        invalidateBranchListCacheMutation.mutate();
        onClose();
      };

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
            onSuccess: handleSuccess,
          },
        });
      } else {
        await triggerCreateCodebaseBranch({
          data: {
            codebaseBranch: newCodebaseBranch,
          },
          callbacks: {
            onSuccess: handleSuccess,
          },
        });
      }
    },
    [codebase.metadata.name, onClose, defaultBranch, triggerCreateCodebaseBranch, invalidateBranchListCacheMutation]
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
      <DialogBody className="flex min-h-0 flex-col !overflow-hidden">
        <div className="flex min-h-0 flex-1 gap-4">
          <div className="min-h-0 flex-1 overflow-y-auto p-0.5">
            <div className="flex flex-col gap-4">
              {requestError && (
                <Alert variant="destructive" title="Failed to create codebase branch">
                  {getK8sErrorMessage(requestError)}
                </Alert>
              )}
              <Form codebase={codebase} defaultBranch={defaultBranch} pipelines={pipelines} />
            </div>
          </div>
          <FormGuidePanel />
        </div>
      </DialogBody>
      <DialogFooter>
        <FormActions onClose={onClose} />
      </DialogFooter>
    </CreateCodebaseBranchFormProvider>
  );
};
