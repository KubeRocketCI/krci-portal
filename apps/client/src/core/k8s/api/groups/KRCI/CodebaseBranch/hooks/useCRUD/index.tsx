import { Snackbar } from "@/core/components/Snackbar";
import { useResourceCRUDMutation } from "@/core/k8s/api/hooks/useResourceCRUDMutation";
import { CodebaseBranch, CodebaseBranchDraft, k8sOperation, k8sCodebaseBranchConfig } from "@my-project/shared";
import React from "react";

export const useCRUD = () => {
  const codebaseBranchCreateMutation = useResourceCRUDMutation<CodebaseBranchDraft, typeof k8sOperation.create>(
    "codebaseBranchCreateMutation",
    k8sOperation.create,
    {
      createCustomMessages: () => ({
        onMutate: {
          message: "Creating CodebaseBranch",
        },
        onError: {
          message: "Failed to create CodebaseBranch",
        },
        onSuccess: {
          message: "CodebaseBranch has been created",
          options: {
            autoHideDuration: 8000,
            content: (key, message) => (
              <Snackbar text={String(message)} snackbarKey={key} route={{}} variant={"success"} />
            ),
          },
        },
      }),
    }
  );

  const codebaseBranchEditMutation = useResourceCRUDMutation<CodebaseBranchDraft, typeof k8sOperation.patch>(
    "codebaseBranchEditMutation",
    k8sOperation.patch,
    {
      createCustomMessages: () => ({
        onMutate: {
          message: "Patching CodebaseBranch",
        },
        onError: {
          message: "Failed to patch CodebaseBranch",
        },
        onSuccess: {
          message: "CodebaseBranch has been patched",
          options: {
            autoHideDuration: 8000,
            content: (key, message) => (
              <Snackbar text={String(message)} snackbarKey={key} route={{}} variant={"success"} />
            ),
          },
        },
      }),
    }
  );

  const triggerCreateCodebaseBranch = React.useCallback(
    async ({
      codebaseBranch,
      defaultCodebaseBranch,
      callbacks,
    }: {
      codebaseBranch: CodebaseBranchDraft;
      defaultCodebaseBranch?: CodebaseBranch;
      callbacks?: { onSuccess?: () => void; onError?: () => void; onSettled?: () => void };
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
      codebaseBranch,
      callbacks,
    }: {
      codebaseBranch: CodebaseBranchDraft;
      callbacks?: { onSuccess?: () => void; onError?: () => void; onSettled?: () => void };
    }) => {
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
