import { trpc } from "@/core/clients/trpc";
import { showToast } from "@/core/components/Snackbar";
import { useRequestStatusMessages } from "@/k8s/api/hooks/useResourceRequestStatusMessages";
import { useClusterStore } from "@/k8s/store";
import { GitLabPipelineResponse, GitLabPipelineVariable } from "@my-project/shared";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import React from "react";
import { useShallow } from "zustand/react/shallow";

interface TriggerGitLabPipelineParams {
  gitServer: string;
  project: string;
  ref: string;
  variables?: GitLabPipelineVariable[];
}

interface UseGitLabPipelineTriggerOptions {
  onSuccess?: (response: GitLabPipelineResponse) => void;
  onError?: (error: Error) => void;
}

export const useGitLabPipelineTrigger = (
  options?: UseGitLabPipelineTriggerOptions
): UseMutationResult<GitLabPipelineResponse, Error, TriggerGitLabPipelineParams> & {
  triggerPipeline: (params: TriggerGitLabPipelineParams) => void;
} => {
  const { showRequestSuccessMessage, showRequestErrorMessage, showRequestErrorDetailedMessage } =
    useRequestStatusMessages();

  const { clusterName, namespace } = useClusterStore(
    useShallow((state) => ({
      namespace: state.defaultNamespace,
      clusterName: state.clusterName,
    }))
  );

  const mutation = useMutation<GitLabPipelineResponse, Error, TriggerGitLabPipelineParams>({
    mutationKey: ["triggerGitLabPipeline"],
    mutationFn: async ({ gitServer, project, ref, variables }) => {
      return await trpc.krakend.triggerGitLabPipeline.mutate({
        clusterName,
        namespace,
        gitServer,
        project,
        ref,
        variables,
      });
    },
    onSuccess: (response, variables) => {
      showToast("GitLab pipeline triggered successfully!", "success", {
        duration: 8000,
        externalLink: response.web_url
          ? {
              url: response.web_url,
              text: "View Pipeline",
            }
          : undefined,
      });
      options?.onSuccess?.(response);
    },
    onError: (error, variables) => {
      showRequestErrorMessage("create" as any, {
        entityName: `GitLab pipeline for ${variables.ref}`,
        customMessage: {
          message: `Failed to trigger GitLab pipeline: ${error.message}`,
        },
      });
      showRequestErrorDetailedMessage(error);
      options?.onError?.(error);
    },
  });

  const triggerPipeline = React.useCallback(
    (params: TriggerGitLabPipelineParams) => {
      mutation.mutate(params);
    },
    [mutation]
  );

  return {
    ...mutation,
    triggerPipeline,
  };
};
