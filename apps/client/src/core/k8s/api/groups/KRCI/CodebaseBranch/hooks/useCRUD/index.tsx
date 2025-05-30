import { useResourceCRUDMutation } from "@/core/k8s/api/hooks/useResourceCRUDMutation";
import { CodebaseBranch, CodebaseBranchDraft, k8sOperation, k8sCodebaseBranchConfig } from "@my-project/shared";
import React from "react";

export const useCRUD = ({
  onSuccess,
  onError,
}: {
  onSuccess?: (codebaseBranch: CodebaseBranch | CodebaseBranchDraft) => void;
  onError?: () => void;
}) => {
  const invokeOnSuccessCallback = React.useCallback(
    (codebaseBranchData: CodebaseBranch | CodebaseBranchDraft) => {
      if (!onSuccess) return;

      onSuccess(codebaseBranchData);
    },
    [onSuccess]
  );
  const invokeOnErrorCallback = React.useCallback(() => onError && onError(), [onError]);

  const codebaseBranchCreateMutation = useResourceCRUDMutation<CodebaseBranchDraft, typeof k8sOperation.create>(
    "codebaseBranchCreateMutation",
    k8sOperation.create
  );

  const codebaseBranchEditMutation = useResourceCRUDMutation<CodebaseBranchDraft, typeof k8sOperation.patch>(
    "codebaseBranchEditMutation",
    k8sOperation.patch
  );

  const createCodebaseBranch = React.useCallback(
    async ({
      codebaseBranch,
      defaultCodebaseBranch,
    }: {
      codebaseBranch: CodebaseBranchDraft;
      defaultCodebaseBranch?: CodebaseBranch;
    }) => {
      codebaseBranchCreateMutation.mutate(
        {
          resource: codebaseBranch,
          resourceConfig: k8sCodebaseBranchConfig,
        },
        {
          onSuccess: () => {
            if (defaultCodebaseBranch) {
              codebaseBranchEditMutation.mutate({
                resource: defaultCodebaseBranch,
                resourceConfig: k8sCodebaseBranchConfig,
              });
            }

            invokeOnSuccessCallback(codebaseBranch);
          },
          onError: () => {
            invokeOnErrorCallback();
          },
        }
      );
    },
    [codebaseBranchCreateMutation, codebaseBranchEditMutation, invokeOnErrorCallback, invokeOnSuccessCallback]
  );

  const editCodebaseBranch = React.useCallback(
    async ({ codebaseBranch }: { codebaseBranch: CodebaseBranchDraft }) => {
      codebaseBranchEditMutation.mutate(
        {
          resource: codebaseBranch,
          resourceConfig: k8sCodebaseBranchConfig,
        },
        {
          onSuccess: () => {
            invokeOnSuccessCallback(codebaseBranch);
          },
          onError: () => {
            invokeOnErrorCallback();
          },
        }
      );
    },
    [codebaseBranchEditMutation, invokeOnErrorCallback, invokeOnSuccessCallback]
  );

  const mutations = {
    codebaseBranchCreateMutation,
    codebaseBranchEditMutation,
  };

  return { createCodebaseBranch, editCodebaseBranch, mutations };
};
