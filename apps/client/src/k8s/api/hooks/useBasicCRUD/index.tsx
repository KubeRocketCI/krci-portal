import { useResourceCRUDMutation } from "@/k8s/api/hooks/useResourceCRUDMutation";
import { k8sOperation, KubeObjectDraft, K8sResourceConfig } from "@my-project/shared";
import React from "react";

export const useBasicCRUD = <T extends KubeObjectDraft>(k8sResourceConfig: K8sResourceConfig) => {
  const createMutation = useResourceCRUDMutation<T, typeof k8sOperation.create>("createMutation", k8sOperation.create, {
    createCustomMessages: () => ({
      loading: {
        message: `Creating ${k8sResourceConfig.kind}`,
      },
      error: {
        message: `Failed to create ${k8sResourceConfig.kind}`,
      },
      success: {
        message: `${k8sResourceConfig.kind} has been created`,
        options: {
          duration: 8000,
        },
      },
    }),
  });

  const editMutation = useResourceCRUDMutation<T, typeof k8sOperation.update>("EditMutation", k8sOperation.update, {
    createCustomMessages: () => ({
      loading: {
        message: `Updating ${k8sResourceConfig.kind}`,
      },
      error: {
        message: `Failed to update ${k8sResourceConfig.kind}`,
      },
      success: {
        message: `${k8sResourceConfig.kind} has been updated`,
        options: {
          duration: 8000,
        },
      },
    }),
  });

  const triggerCreate = React.useCallback(
    async ({
      data,
      callbacks,
    }: {
      data: {
        resource: T;
      };
      callbacks?: { onSuccess?: () => void; onError?: () => void; onSettled?: () => void };
    }) => {
      const { resource } = data;

      createMutation.mutate(
        {
          resource,
          resourceConfig: k8sResourceConfig,
        },
        {
          onSuccess: callbacks?.onSuccess,
          onError: callbacks?.onError,
          onSettled: callbacks?.onSettled,
        }
      );
    },
    [createMutation, k8sResourceConfig]
  );

  const triggerEdit = React.useCallback(
    async ({
      data,
      callbacks,
    }: {
      data: {
        resource: T;
      };
      callbacks?: { onSuccess?: () => void; onError?: () => void; onSettled?: () => void };
    }) => {
      const { resource } = data;

      editMutation.mutate(
        {
          resource,
          resourceConfig: k8sResourceConfig,
        },
        {
          onSuccess: callbacks?.onSuccess,
          onError: callbacks?.onError,
          onSettled: callbacks?.onSettled,
        }
      );
    },
    [editMutation, k8sResourceConfig]
  );

  const deleteMutation = useResourceCRUDMutation<T, typeof k8sOperation.delete>("deleteMutation", k8sOperation.delete, {
    createCustomMessages: () => ({
      loading: {
        message: `Deleting ${k8sResourceConfig.kind}`,
      },
      error: {
        message: `Failed to delete ${k8sResourceConfig.kind}`,
      },
      success: {
        message: `${k8sResourceConfig.kind} has been marked for deletion`,
        options: {
          duration: 8000,
        },
      },
    }),
  });

  const triggerDelete = React.useCallback(
    async ({
      data,
      callbacks,
    }: {
      data: {
        resource: T;
      };
      callbacks?: { onSuccess?: () => void; onError?: () => void; onSettled?: () => void };
    }) => {
      const { resource } = data;

      deleteMutation.mutate(
        {
          resource,
          resourceConfig: k8sResourceConfig,
        },
        {
          onSuccess: callbacks?.onSuccess,
          onError: callbacks?.onError,
          onSettled: callbacks?.onSettled,
        }
      );
    },
    [deleteMutation, k8sResourceConfig]
  );

  return {
    triggerCreate,
    triggerEdit,
    triggerDelete,
    mutations: {
      createMutation,
      editMutation,
      deleteMutation,
    },
  };
};
