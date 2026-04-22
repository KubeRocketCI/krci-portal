import { useResourceCRUDMutation } from "@/k8s/api/hooks/useResourceCRUDMutation";
import { useClusterStore } from "@/k8s/store";
import { PATH_PIPELINERUN_DETAILS_FULL } from "@/modules/platform/tekton/pages/pipelinerun-details/route";
import { k8sOperation, k8sPipelineRunConfig, PipelineRun, PipelineRunDraft } from "@my-project/shared";
import React from "react";
import { useShallow } from "zustand/react/shallow";

export const useCRUD = () => {
  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );

  const pipelineRunCreateMutation = useResourceCRUDMutation<PipelineRunDraft, typeof k8sOperation.create>(
    "pipelineRunCreateMutation",
    k8sOperation.create,
    {
      createCustomMessages: (pipelineRun) => ({
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
            route: {
              to: PATH_PIPELINERUN_DETAILS_FULL,
              params: {
                clusterName,
                namespace: pipelineRun.metadata.namespace || defaultNamespace,
                name: pipelineRun.metadata.name,
              },
            },
          },
        },
      }),
    }
  );

  const pipelineRunEditMutation = useResourceCRUDMutation<PipelineRunDraft, typeof k8sOperation.update>(
    "pipelineRunEditMutation",
    k8sOperation.update,
    {
      createCustomMessages: () => ({
        loading: {
          message: "Updating PipelineRun",
        },
        error: {
          message: "Failed to update PipelineRun",
        },
        success: {
          message: "PipelineRun has been updated",
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

      pipelineRunEditMutation.mutate(
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
    [pipelineRunEditMutation]
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
    pipelineRunEditMutation,
    pipelineRunDeleteMutation,
  };

  return { triggerCreatePipelineRun, triggerPatchPipelineRun, triggerDeletePipelineRun, mutations };
};
