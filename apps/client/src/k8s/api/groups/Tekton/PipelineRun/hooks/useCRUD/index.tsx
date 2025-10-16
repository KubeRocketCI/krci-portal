import { useResourceCRUDMutation } from "@/k8s/api/hooks/useResourceCRUDMutation";
import { k8sOperation, k8sPipelineRunConfig, PipelineRun, PipelineRunDraft } from "@my-project/shared";
import React from "react";

export const useCRUD = () => {
  const pipelineRunCreateMutation = useResourceCRUDMutation<PipelineRunDraft, typeof k8sOperation.create>(
    "pipelineRunCreateMutation",
    k8sOperation.create,
    {
      createCustomMessages: () => ({
        loading: {
          message: "Creating PipelineRun",
        },
        error: {
          message: "Failed to create PipelineRun",
        },
        success: {
          message: "PipelineRun has been created",
          options: {
            duration: 8000,
          },
        },
      }),
    }
  );

  const pipelineRunPatchMutation = useResourceCRUDMutation<PipelineRunDraft, typeof k8sOperation.patch>(
    "pipelineRunPatchMutation",
    k8sOperation.patch,
    {
      createCustomMessages: () => ({
        loading: {
          message: "Patching PipelineRun",
        },
        error: {
          message: "Failed to patch PipelineRun",
        },
        success: {
          message: "PipelineRun has been patched",
          options: {
            duration: 8000,
          },
        },
      }),
    }
  );

  const pipelineRunDeleteMutation = useResourceCRUDMutation<PipelineRunDraft, typeof k8sOperation.delete>(
    "pipelineRunDeleteMutation",
    k8sOperation.delete,
    {
      createCustomMessages: () => ({
        loading: {
          message: "Deleting PipelineRun",
        },
        error: {
          message: "Failed to delete PipelineRun",
        },
        success: {
          message: "PipelineRun has been deleted",
          options: {
            duration: 8000,
          },
        },
      }),
    }
  );

  const triggerCreatePipelineRun = React.useCallback(
    async ({
      data,
      callbacks,
    }: {
      data: {
        pipelineRun: PipelineRunDraft;
      };
      callbacks?: { onSuccess?: () => void; onError?: () => void; onSettled?: () => void };
    }) => {
      const { pipelineRun } = data;

      pipelineRunCreateMutation.mutate(
        {
          resource: pipelineRun,
          resourceConfig: k8sPipelineRunConfig,
        },
        {
          onSuccess: callbacks?.onSuccess,
          onError: callbacks?.onError,
          onSettled: callbacks?.onSettled,
        }
      );
    },
    [pipelineRunCreateMutation]
  );

  const triggerPatchPipelineRun = React.useCallback(
    async ({
      data,
      callbacks,
    }: {
      data: {
        pipelineRun: PipelineRun;
      };
      callbacks?: { onSuccess?: () => void; onError?: () => void; onSettled?: () => void };
    }) => {
      const { pipelineRun } = data;

      pipelineRunPatchMutation.mutate(
        {
          resource: pipelineRun,
          resourceConfig: k8sPipelineRunConfig,
        },
        {
          onSuccess: callbacks?.onSuccess,
          onError: callbacks?.onError,
          onSettled: callbacks?.onSettled,
        }
      );
    },
    [pipelineRunPatchMutation]
  );

  const triggerDeletePipelineRun = React.useCallback(
    async ({
      data,
      callbacks,
    }: {
      data: {
        pipelineRun: PipelineRun;
      };
      callbacks?: { onSuccess?: () => void; onError?: () => void; onSettled?: () => void };
    }) => {
      const { pipelineRun } = data;

      pipelineRunDeleteMutation.mutate(
        {
          resource: pipelineRun,
          resourceConfig: k8sPipelineRunConfig,
        },
        {
          onSuccess: callbacks?.onSuccess,
          onError: callbacks?.onError,
          onSettled: callbacks?.onSettled,
        }
      );
    },
    [pipelineRunDeleteMutation]
  );

  const mutations = {
    pipelineRunCreateMutation,
    pipelineRunPatchMutation,
    pipelineRunDeleteMutation,
  };

  return { triggerCreatePipelineRun, triggerPatchPipelineRun, triggerDeletePipelineRun, mutations };
};
