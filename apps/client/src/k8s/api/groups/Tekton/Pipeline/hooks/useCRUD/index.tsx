import { Snackbar } from "@/core/components/Snackbar";
import { useResourceCRUDMutation } from "@/k8s/api/hooks/useResourceCRUDMutation";
import { k8sOperation, k8sPipelineConfig, Pipeline, PipelineDraft } from "@my-project/shared";
import React from "react";

export const useCRUD = () => {
  const pipelineCreateMutation = useResourceCRUDMutation<PipelineDraft, typeof k8sOperation.create>(
    "pipelineCreateMutation",
    k8sOperation.create,
    {
      createCustomMessages: () => ({
        onMutate: {
          message: "Creating Pipeline",
        },
        onError: {
          message: "Failed to create Pipeline",
        },
        onSuccess: {
          message: "Pipeline has been created",
          options: {
            autoHideDuration: 8000,
            content: (key, message) => <Snackbar text={String(message)} snackbarKey={key} variant={"success"} />,
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
        onMutate: {
          message: "Patching Pipeline",
        },
        onError: {
          message: "Failed to patch Pipeline",
        },
        onSuccess: {
          message: "Pipeline has been patched",
          options: {
            autoHideDuration: 8000,
            content: (key, message) => <Snackbar text={String(message)} snackbarKey={key} variant={"success"} />,
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
        onMutate: {
          message: "Deleting Pipeline",
        },
        onError: {
          message: "Failed to delete Pipeline",
        },
        onSuccess: {
          message: "Pipeline has been deleted",
          options: {
            autoHideDuration: 8000,
            content: (key, message) => <Snackbar text={String(message)} snackbarKey={key} variant={"success"} />,
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
