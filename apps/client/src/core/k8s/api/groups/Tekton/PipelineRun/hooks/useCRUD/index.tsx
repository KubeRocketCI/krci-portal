import { Snackbar } from "@/core/components/Snackbar";
import { useResourceCRUDMutation } from "@/core/k8s/api/hooks/useResourceCRUDMutation";
import { k8sOperation, k8sPipelineRunConfig, PipelineRun, PipelineRunDraft } from "@my-project/shared";
import React from "react";

export const useCRUD = () => {
  const pipelineRunCreateMutation = useResourceCRUDMutation<PipelineRunDraft, typeof k8sOperation.create>(
    "pipelineRunCreateMutation",
    k8sOperation.create,
    {
      createCustomMessages: () => ({
        onMutate: {
          message: "Creating PipelineRun",
        },
        onError: {
          message: "Failed to create PipelineRun",
        },
        onSuccess: {
          message: "PipelineRun has been created",
          options: {
            autoHideDuration: 8000,
            content: (key, message) => <Snackbar text={String(message)} snackbarKey={key} variant={"success"} />,
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
        onMutate: {
          message: "Patching PipelineRun",
        },
        onError: {
          message: "Failed to patch PipelineRun",
        },
        onSuccess: {
          message: "PipelineRun has been patched",
          options: {
            autoHideDuration: 8000,
            content: (key, message) => <Snackbar text={String(message)} snackbarKey={key} variant={"success"} />,
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
        onMutate: {
          message: "Deleting PipelineRun",
        },
        onError: {
          message: "Failed to delete PipelineRun",
        },
        onSuccess: {
          message: "PipelineRun has been deleted",
          options: {
            autoHideDuration: 8000,
            content: (key, message) => <Snackbar text={String(message)} snackbarKey={key} variant={"success"} />,
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
