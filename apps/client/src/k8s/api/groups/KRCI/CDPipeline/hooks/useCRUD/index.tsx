import { useResourceCRUDMutation } from "@/k8s/api/hooks/useResourceCRUDMutation";
import { CDPipelineDraft, k8sOperation, k8sCDPipelineConfig } from "@my-project/shared";
import React from "react";

export const useCRUD = () => {
  const cdPipelineCreateMutation = useResourceCRUDMutation<CDPipelineDraft, typeof k8sOperation.create>(
    "cdPipelineCreateMutation",
    k8sOperation.create,
    {
      createCustomMessages: () => ({
        loading: {
          message: "Creating CDPipeline",
        },
        error: {
          message: "Failed to create CDPipeline",
        },
        success: {
          message: "CDPipeline has been created",
          options: {
            duration: 8000,
          },
        },
      }),
    }
  );

  const cdPipelineEditMutation = useResourceCRUDMutation<CDPipelineDraft, typeof k8sOperation.patch>(
    "cdPipelineEditMutation",
    k8sOperation.patch,
    {
      createCustomMessages: () => ({
        loading: {
          message: "Patching CDPipeline",
        },
        error: {
          message: "Failed to patch CDPipeline",
        },
        success: {
          message: "CDPipeline has been patched",
          options: {
            duration: 8000,
          },
        },
      }),
    }
  );

  const triggerCreateCDPipeline = React.useCallback(
    async ({
      data,
      callbacks,
    }: {
      data: {
        cdPipeline: CDPipelineDraft;
      };
      callbacks?: { onSuccess?: () => void; onError?: () => void; onSettled?: () => void };
    }) => {
      const { cdPipeline } = data;

      cdPipelineCreateMutation.mutate(
        {
          resource: cdPipeline,
          resourceConfig: k8sCDPipelineConfig,
        },
        {
          onSuccess: callbacks?.onSuccess,
          onError: callbacks?.onError,
          onSettled: callbacks?.onSettled,
        }
      );
    },
    [cdPipelineCreateMutation]
  );

  const triggerEditCDPipeline = React.useCallback(
    async ({
      data,
      callbacks,
    }: {
      data: {
        cdPipeline: CDPipelineDraft;
      };
      callbacks?: { onSuccess?: () => void; onError?: () => void; onSettled?: () => void };
    }) => {
      const { cdPipeline } = data;

      cdPipelineEditMutation.mutate(
        {
          resource: cdPipeline,
          resourceConfig: k8sCDPipelineConfig,
        },
        {
          onSuccess: callbacks?.onSuccess,
          onError: callbacks?.onError,
          onSettled: callbacks?.onSettled,
        }
      );
    },
    [cdPipelineEditMutation]
  );

  const mutations = {
    cdPipelineCreateMutation,
    cdPipelineEditMutation,
  };

  return { triggerCreateCDPipeline, triggerEditCDPipeline, mutations };
};
