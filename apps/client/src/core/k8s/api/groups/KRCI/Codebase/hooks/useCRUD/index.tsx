import { Snackbar } from "@/core/components/Snackbar";
import { useResourceCRUDMutation } from "@/core/k8s/api/hooks/useResourceCRUDMutation";
import {
  Codebase,
  CodebaseDraft,
  createCodebaseDraftSecretObject,
  k8sCodebaseConfig,
  k8sSecretConfig,
  KubeObjectDraft,
  k8sOperation,
} from "@my-project/shared";
import React from "react";

export const useCRUD = () => {
  const codebaseCreateMutation = useResourceCRUDMutation<CodebaseDraft, typeof k8sOperation.create>(
    "codebaseCreateMutation",
    k8sOperation.create,
    {
      createCustomMessages: () => ({
        onMutate: {
          message: "Creating Codebase",
        },
        onError: {
          message: "Failed to create Codebase",
        },
        onSuccess: {
          message: "Codebase has been created",
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

  const codebaseSecretDeleteMutation = useResourceCRUDMutation<KubeObjectDraft, typeof k8sOperation.delete>(
    "codebaseSecretDeleteMutation",
    k8sOperation.delete
  );

  const codebaseSecretCreateMutation = useResourceCRUDMutation<KubeObjectDraft, typeof k8sOperation.create>(
    "codebaseSecretCreateMutation",
    k8sOperation.create
  );

  const codebasePatchMutation = useResourceCRUDMutation<CodebaseDraft, typeof k8sOperation.patch>(
    "codebasePatchMutation",
    k8sOperation.patch,
    {
      createCustomMessages: () => ({
        onMutate: {
          message: "Patching Codebase",
        },
        onError: {
          message: "Failed to patch Codebase",
        },
        onSuccess: {
          message: "Codebase has been patched",
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

  const triggerCreateCodebase = React.useCallback(
    async ({
      data,
      callbacks,
    }: {
      data: {
        codebase: CodebaseDraft;
        codebaseAuth: {
          repositoryLogin: string;
          repositoryPasswordOrApiToken: string;
        } | null;
      };
      callbacks?: { onSuccess?: () => void; onError?: () => void; onSettled?: () => void };
    }) => {
      const { codebase, codebaseAuth } = data;

      if (!codebaseAuth) {
        codebaseCreateMutation.mutate(
          {
            resource: codebase,
            resourceConfig: k8sCodebaseConfig,
          },
          {
            onSuccess: callbacks?.onSuccess,
            onError: callbacks?.onError,
            onSettled: callbacks?.onSettled,
          }
        );
        return;
      }

      const { repositoryLogin, repositoryPasswordOrApiToken } = codebaseAuth;
      const {
        metadata: { name },
      } = codebase;
      const codebaseSecretDraft = createCodebaseDraftSecretObject({
        codebaseName: name,
        username: repositoryLogin,
        password: repositoryPasswordOrApiToken,
      });

      codebaseSecretCreateMutation.mutate(
        {
          resource: codebaseSecretDraft,
          resourceConfig: k8sSecretConfig,
        },
        {
          onSuccess: () => {
            codebaseCreateMutation.mutate(
              {
                resource: codebase,
                resourceConfig: k8sCodebaseConfig,
              },
              {
                onSuccess: callbacks?.onSuccess,
                onError: () => {
                  codebaseSecretDeleteMutation.mutate({
                    resource: codebaseSecretDraft,
                    resourceConfig: k8sSecretConfig,
                  });

                  callbacks?.onError?.();
                },
                onSettled: callbacks?.onSettled,
              }
            );
          },
          onError: () => {
            codebaseSecretDeleteMutation.mutate({
              resource: codebaseSecretDraft,
              resourceConfig: k8sSecretConfig,
            });

            callbacks?.onError?.();
          },
        }
      );
    },
    [codebaseCreateMutation, codebaseSecretCreateMutation, codebaseSecretDeleteMutation]
  );

  const triggerPatchCodebase = React.useCallback(
    async ({
      data,
      callbacks,
    }: {
      data: {
        codebase: Codebase;
      };
      callbacks?: { onSuccess?: () => void; onError?: () => void; onSettled?: () => void };
    }) => {
      const { codebase } = data;

      codebasePatchMutation.mutate(
        {
          resource: codebase,
          resourceConfig: k8sCodebaseConfig,
        },
        {
          onSuccess: callbacks?.onSuccess,
          onError: callbacks?.onError,
          onSettled: callbacks?.onSettled,
        }
      );
    },
    [codebasePatchMutation]
  );

  const mutations = {
    codebaseCreateMutation,
    codebaseSecretCreateMutation,
    codebaseSecretDeleteMutation,
    codebasePatchMutation,
  };

  return { triggerCreateCodebase, triggerPatchCodebase, mutations };
};
