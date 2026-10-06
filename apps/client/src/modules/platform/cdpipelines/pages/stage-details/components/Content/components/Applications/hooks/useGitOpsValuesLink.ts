import React from "react";
import { GitProvider } from "@my-project/shared";
import { LinkCreationService } from "@/k8s/services/link-creation";
import { useGitOpsCodebaseWatch, useGitServersWatch } from "@/modules/platform/cdpipelines/pages/stage-details/hooks";
import { routeStageDetails } from "@/modules/platform/cdpipelines/pages/stage-details/route";

/** Builds the link to an application's values.yaml in the GitOps repo. Undefined until the GitOps codebase has a web URL. */
export type GitOpsValuesLink = ((appName: string) => string | undefined) | undefined;

// Called once per table, not per row: the GitOps codebase and GitServer are shared by every application.
export const useGitOpsValuesLink = (): GitOpsValuesLink => {
  const params = routeStageDetails.useParams();
  const gitOpsCodebase = useGitOpsCodebaseWatch().data;
  const gitServers = useGitServersWatch().data.array;

  return React.useMemo(() => {
    const gitWebUrl = gitOpsCodebase?.status?.gitWebUrl;
    if (!gitWebUrl) return undefined;

    const gitProvider = gitServers.find((gitServer) => gitServer.metadata.name === gitOpsCodebase.spec.gitServer)?.spec
      .gitProvider as GitProvider;

    return (appName: string) =>
      LinkCreationService.git.createGitOpsValuesYamlFileLink(
        gitWebUrl,
        params.cdPipeline,
        params.stage,
        appName,
        gitProvider
      );
  }, [gitOpsCodebase, gitServers, params.cdPipeline, params.stage]);
};
