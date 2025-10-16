import { useResourceCRUDMutation } from "@/k8s/api/hooks/useResourceCRUDMutation";
import { StageDraft, k8sOperation, k8sStageConfig } from "@my-project/shared";
import React from "react";

export const useCRUD = () => {
  const stageCreateMutation = useResourceCRUDMutation<StageDraft, typeof k8sOperation.create>(
    "stageCreateMutation",
    k8sOperation.create,
    {
      createCustomMessages: () => ({
        loading: {
          message: "Creating Stage",
        },
        error: {
          message: "Failed to create Stage",
        },
        success: {
          message: "Stage has been created",
          options: {
            duration: 8000,
          },
        },
      }),
    }
  );

  const stageEditMutation = useResourceCRUDMutation<StageDraft, typeof k8sOperation.patch>(
    "stageEditMutation",
    k8sOperation.patch,
    {
      createCustomMessages: () => ({
        loading: {
          message: "Patching Stage",
        },
        error: {
          message: "Failed to patch Stage",
        },
        success: {
          message: "Stage has been patched",
          options: {
            duration: 8000,
          },
        },
      }),
    }
  );

  const triggerCreateStage = React.useCallback(
    async ({
      data,
      callbacks,
    }: {
      data: {
        stage: StageDraft;
      };
      callbacks?: { onSuccess?: () => void; onError?: () => void; onSettled?: () => void };
    }) => {
      const { stage } = data;

      stageCreateMutation.mutate(
        {
          resource: stage,
          resourceConfig: k8sStageConfig,
        },
        {
          onSuccess: callbacks?.onSuccess,
          onError: callbacks?.onError,
          onSettled: callbacks?.onSettled,
        }
      );
    },
    [stageCreateMutation]
  );

  const triggerEditStage = React.useCallback(
    async ({
      data,
      callbacks,
    }: {
      data: {
        stage: StageDraft;
      };
      callbacks?: { onSuccess?: () => void; onError?: () => void; onSettled?: () => void };
    }) => {
      const { stage } = data;

      stageEditMutation.mutate(
        {
          resource: stage,
          resourceConfig: k8sStageConfig,
        },
        {
          onSuccess: callbacks?.onSuccess,
          onError: callbacks?.onError,
          onSettled: callbacks?.onSettled,
        }
      );
    },
    [stageEditMutation]
  );

  const mutations = {
    stageCreateMutation,
    stageEditMutation,
  };

  return { triggerCreateStage, triggerEditStage, mutations };
};
