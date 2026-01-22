import { useResourceCRUDMutation } from "@/k8s/api/hooks/useResourceCRUDMutation";
import { CodebaseBranch, CodebaseBranchDraft, k8sOperation, k8sCodebaseBranchConfig } from "@my-project/shared";
import React from "react";

export const useCRUD = () => {
  const codebaseBranchCreateMutation = useResourceCRUDMutation<CodebaseBranchDraft, typeof k8sOperation.create>(
    "codebaseBranchCreateMutation",
    k8sOperation.create,
    {
      showMessages: false, // Disable toasts - errors are shown in dialog
      createCustomMessages: () => ({
        loading: {
          message: "Creating CodebaseBranch",
        },
        error: {
          message: "Failed to create CodebaseBranch",
        },
        success: {
          message: "CodebaseBranch has been created",
          options: {
            duration: 8000,
          },
        },
      }),
    }
  );

  const codebaseBranchEditMutation = useResourceCRUDMutation<CodebaseBranchDraft, typeof k8sOperation.patch>(
    "codebaseBranchEditMutation",
    k8sOperation.patch,
    {
      showMessages: false, // Disable toasts - errors are shown in dialog
      createCustomMessages: () => ({
        loading: {
          message: "Patching CodebaseBranch",
        },
        error: {
          message: "Failed to patch CodebaseBranch",
        },
        success: {
          message: "CodebaseBranch has been patched",
          options: {
            duration: 8000,
          },
        },
      }),
    }
  );

  const triggerCreateCodebaseBranch = React.useCallback(
    async ({
      data,
      callbacks,
    }: {
      data: {
        codebaseBranch: CodebaseBranchDraft;
        defaultCodebaseBranch?: CodebaseBranch;
      };
      callbacks?: { onSuccess?: () => void; onError?: () => void; onSettled?: () => void };
    }) => {
      const { codebaseBranch, defaultCodebaseBranch } = data;

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

            callbacks?.onSuccess?.();
          },
          onError: () => {
            callbacks?.onError?.();
          },
          onSettled: callbacks?.onSettled,
        }
      );
    },
    [codebaseBranchCreateMutation, codebaseBranchEditMutation]
  );

  const triggerEditCodebaseBranch = React.useCallback(
    async ({
      data,
      callbacks,
    }: {
      data: {
        codebaseBranch: CodebaseBranchDraft;
      };
      callbacks?: { onSuccess?: () => void; onError?: () => void; onSettled?: () => void };
    }) => {
      const { codebaseBranch } = data;

      codebaseBranchEditMutation.mutate(
        {
          resource: codebaseBranch,
          resourceConfig: k8sCodebaseBranchConfig,
        },
        {
          onSuccess: callbacks?.onSuccess,
          onError: callbacks?.onError,
          onSettled: callbacks?.onSettled,
        }
      );
    },
    [codebaseBranchEditMutation]
  );

  const mutations = {
    codebaseBranchCreateMutation,
    codebaseBranchEditMutation,
  };

  return { triggerCreateCodebaseBranch, triggerEditCodebaseBranch, mutations };
};
