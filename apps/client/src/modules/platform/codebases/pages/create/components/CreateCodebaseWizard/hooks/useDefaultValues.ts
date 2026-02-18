import { ciTool, codebaseDeploymentScript, codebaseVersioning } from "@my-project/shared";
import React from "react";
import { useGitServerWatchList } from "@/k8s/api/groups/KRCI/GitServer";
import type { CreateCodebaseFormValues } from "../schema";
import { NAMES } from "../names";
// DeepPartial type - makes all nested properties optional
type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

const defaultEDPVersioningValue = "0.1.0-SNAPSHOT";
const [defaultEDPVersioningVersion, defaultEDPVersioningVersionPostfix] = defaultEDPVersioningValue.split("-");

export const useDefaultValues = (): DeepPartial<CreateCodebaseFormValues> => {
  const gitServersWatch = useGitServerWatchList();

  return React.useMemo(() => {
    if (gitServersWatch.query.isLoading) {
      return {};
    }

    const firstValidGitServer = gitServersWatch.data.array.find((gitServer) => gitServer.status?.connected);

    return {
      [NAMES.defaultBranch]: "main",
      [NAMES.emptyProject]: false,
      [NAMES.private]: true,
      [NAMES.versioningType]: codebaseVersioning.semver,
      [NAMES.versioningStartFrom]: defaultEDPVersioningValue,
      [NAMES.ciTool]: ciTool.tekton,
      [NAMES.ui_gitlabCiTemplate]: null,
      [NAMES.gitServer]: firstValidGitServer?.metadata.name || "",
      [NAMES.deploymentScript]: codebaseDeploymentScript["helm-chart"],
      [NAMES.repositoryUrl]: null,
      [NAMES.ui_creationMethod]: "template",
      [NAMES.ui_hasCodebaseAuth]: false,
      [NAMES.ui_hasJiraServerIntegration]: false,
      [NAMES.ui_versioningStartFromVersion]: defaultEDPVersioningVersion,
      [NAMES.ui_versioningStartFromSnapshot]: defaultEDPVersioningVersionPostfix,
      [NAMES.ui_advancedMappingFieldName]: [],
      [NAMES.ui_advancedMappingRows]: [],
    };
  }, [gitServersWatch.data.array, gitServersWatch.query.isLoading]);
};
