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

export const useCRUD = ({
  onSuccess,
  onError,
}: {
  onSuccess?: (codebase: Codebase | CodebaseDraft) => void;
  onError?: () => void;
}) => {
  const invokeOnSuccessCallback = React.useCallback(
    (codebase: Codebase | CodebaseDraft) => {
      if (!onSuccess) return;

      onSuccess(codebase);
    },
    [onSuccess]
  );
  const invokeOnErrorCallback = React.useCallback(() => onError && onError(), [onError]);

  const codebaseCreateMutation = useResourceCRUDMutation<CodebaseDraft, typeof k8sOperation.create>(
    "codebaseCreateMutation",
    k8sOperation.create
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
    k8sOperation.patch
  );

  const createCodebase = React.useCallback(
    async ({
      codebase,
      codebaseAuth,
    }: {
      codebase: CodebaseDraft;
      codebaseAuth: {
        repositoryLogin: string;
        repositoryPasswordOrApiToken: string;
      } | null;
    }) => {
      if (!codebaseAuth) {
        codebaseCreateMutation.mutate(
          {
            resource: codebase,
            resourceConfig: k8sCodebaseConfig,
          },
          {
            onSuccess: () => {
              invokeOnSuccessCallback(codebase);
            },
            onError: () => {
              invokeOnErrorCallback();
            },
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
                onSuccess: () => {
                  invokeOnSuccessCallback(codebase);
                },
                onError: () => {
                  codebaseSecretDeleteMutation.mutate({
                    resource: codebaseSecretDraft,
                    resourceConfig: k8sSecretConfig,
                  });

                  invokeOnErrorCallback();
                },
              }
            );
          },
          onError: () => {
            codebaseSecretDeleteMutation.mutate({
              resource: codebaseSecretDraft,
              resourceConfig: k8sSecretConfig,
            });

            invokeOnErrorCallback();
          },
        }
      );
    },
    [
      codebaseCreateMutation,
      codebaseSecretCreateMutation,
      codebaseSecretDeleteMutation,
      invokeOnErrorCallback,
      invokeOnSuccessCallback,
    ]
  );

  const patchCodebase = React.useCallback(
    async ({ codebase }: { codebase: Codebase }) => {
      codebasePatchMutation.mutate(
        {
          resource: codebase,
          resourceConfig: k8sCodebaseConfig,
        },
        {
          onSuccess: () => {
            invokeOnSuccessCallback(codebase);
          },
          onError: () => {
            invokeOnErrorCallback();
          },
        }
      );
    },
    [codebasePatchMutation, invokeOnErrorCallback, invokeOnSuccessCallback]
  );

  const mutations = {
    codebaseCreateMutation,
    codebaseSecretCreateMutation,
    codebaseSecretDeleteMutation,
    codebasePatchMutation,
  };

  return { createCodebase, patchCodebase, mutations };
};
