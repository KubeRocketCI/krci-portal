import { useResourceCRUDMutation } from "@/k8s/api/hooks/useResourceCRUDMutation";
import { k8sOperation, k8sPipelineConfig, Pipeline, PipelineDraft } from "@my-project/shared";
import React from "react";

export const useCRUD = () => {
  const pipelineCreateMutation = useResourceCRUDMutation<PipelineDraft, typeof k8sOperation.create>(
    "pipelineCreateMutation",
    k8sOperation.create,
    {
      createCustomMessages: () => ({
        loading: {
          message: "Creating Pipeline",
        },
        error: {
          message: "Failed to create Pipeline",
        },
        success: {
          message: "Pipeline has been created",
          options: {
            duration: 8000,
          },
        },
      }),
    }
  );

  const pipelinePatchMutation = useResourceCRUDMutation<PipelineDraft, typeof k8sOperation.patch>(
    "pipelinePatchMutation",
    k8sOperation.patch,
    {
      createCustomMessages: () => ({
        loading: {
          message: "Patching Pipeline",
        },
        error: {
          message: "Failed to patch Pipeline",
        },
        success: {
          message: "Pipeline has been patched",
          options: {
            duration: 8000,
          },
        },
      }),
    }
  );

  const pipelineDeleteMutation = useResourceCRUDMutation<PipelineDraft, typeof k8sOperation.delete>(
    "pipelineDeleteMutation",
    k8sOperation.delete,
    {
      createCustomMessages: () => ({
        loading: {
          message: "Deleting Pipeline",
        },
        error: {
          message: "Failed to delete Pipeline",
        },
        success: {
          message: "Pipeline has been deleted",
          options: {
            duration: 8000,
          },
        },
      }),
    }
  );

  const triggerCreatePipeline = React.useCallback(
    async ({
      data,
      callbacks,
    }: {
      data: {
        pipeline: PipelineDraft;
      };
      callbacks?: { onSuccess?: () => void; onError?: () => void; onSettled?: () => void };
    }) => {
      const { pipeline } = data;

      pipelineCreateMutation.mutate(
        {
          resource: pipeline,
          resourceConfig: k8sPipelineConfig,
        },
        {
          onSuccess: callbacks?.onSuccess,
          onError: callbacks?.onError,
          onSettled: callbacks?.onSettled,
        }
      );
    },
    [pipelineCreateMutation]
  );

  const triggerPatchPipeline = React.useCallback(
    async ({
      data,
      callbacks,
    }: {
      data: {
        pipeline: Pipeline;
      };
      callbacks?: { onSuccess?: () => void; onError?: () => void; onSettled?: () => void };
    }) => {
      const { pipeline } = data;

      pipelinePatchMutation.mutate(
        {
          resource: pipeline,
          resourceConfig: k8sPipelineConfig,
        },
        {
          onSuccess: callbacks?.onSuccess,
          onError: callbacks?.onError,
          onSettled: callbacks?.onSettled,
        }
      );
    },
    [pipelinePatchMutation]
  );

  const triggerDeletePipeline = React.useCallback(
    async ({
      data,
      callbacks,
    }: {
      data: {
        pipeline: Pipeline;
      };
      callbacks?: { onSuccess?: () => void; onError?: () => void; onSettled?: () => void };
    }) => {
      const { pipeline } = data;

      pipelineDeleteMutation.mutate(
        {
          resource: pipeline,
          resourceConfig: k8sPipelineConfig,
        },
        {
          onSuccess: callbacks?.onSuccess,
          onError: callbacks?.onError,
          onSettled: callbacks?.onSettled,
        }
      );
    },
    [pipelineDeleteMutation]
  );

  const mutations = {
    pipelineCreateMutation,
    pipelinePatchMutation,
    pipelineDeleteMutation,
  };

  return { triggerCreatePipeline, triggerPatchPipeline, triggerDeletePipeline, mutations };
};
