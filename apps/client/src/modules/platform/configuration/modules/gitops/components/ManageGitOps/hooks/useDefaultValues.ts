import React from "react";
import { GIT_OPS_CODEBASE_NAME } from "../constants";
import { CODEBASE_FORM_NAMES } from "../names";
import { ManageGitOpsDataContext, ManageGitOpsValues } from "../types";
import { useGitServerWatchList } from "@/k8s/api/groups/KRCI/GitServer";
import {
  ciTool,
  codebaseCreationStrategy,
  codebaseDeploymentScript,
  codebaseType,
  codebaseVersioning,
} from "@my-project/shared";

const createDefaultValues = (gitServer: string): ManageGitOpsValues => ({
  [CODEBASE_FORM_NAMES.EMPTY_PROJECT]: false,
  [CODEBASE_FORM_NAMES.NAME]: GIT_OPS_CODEBASE_NAME,
  [CODEBASE_FORM_NAMES.GIT_URL_PATH]: `/${GIT_OPS_CODEBASE_NAME}`,
  [CODEBASE_FORM_NAMES.LANG]: "helm",
  [CODEBASE_FORM_NAMES.FRAMEWORK]: "gitops",
  [CODEBASE_FORM_NAMES.BUILD_TOOL]: "helm",
  [CODEBASE_FORM_NAMES.CI_TOOL]: ciTool.tekton,
  [CODEBASE_FORM_NAMES.GIT_SERVER]: gitServer,
  [CODEBASE_FORM_NAMES.DEFAULT_BRANCH]: "main",
  [CODEBASE_FORM_NAMES.DEPLOYMENT_SCRIPT]: codebaseDeploymentScript["helm-chart"],
  [CODEBASE_FORM_NAMES.DESCRIPTION]: "Custom values for deploy applications",
  [CODEBASE_FORM_NAMES.STRATEGY]: codebaseCreationStrategy.create,
  [CODEBASE_FORM_NAMES.TYPE]: codebaseType.system,
  [CODEBASE_FORM_NAMES.VERSIONING_TYPE]: codebaseVersioning.semver,
  [CODEBASE_FORM_NAMES.VERSIONING_START_FROM]: "0.1.0-SNAPSHOT",
  [CODEBASE_FORM_NAMES.SYSTEM_TYPE_LABEL]: "gitops",
  [CODEBASE_FORM_NAMES.NAMESPACE]: "",
  [CODEBASE_FORM_NAMES.GIT_REPO_PATH]: "",
});

export const useDefaultValues = ({ formData }: { formData: ManageGitOpsDataContext }): ManageGitOpsValues => {
  const { currentElement } = formData;

  const isPlaceholder = typeof currentElement === "string" && currentElement === "placeholder";

  const gitServersWatch = useGitServerWatchList();

  const gitServers = gitServersWatch.data.array;

  const firstValidGitServer = gitServers?.find((gitServer) => gitServer?.status?.connected);

  return React.useMemo(() => {
    const baseDefaults = createDefaultValues(firstValidGitServer?.metadata.name || "");

    if (isPlaceholder) {
      return baseDefaults;
    }

    const gitUrlPath = currentElement?.spec.gitUrlPath || "";
    const gitUrlPathWithNoSlashAtTheStart = gitUrlPath.replace("/", "");
    const gitRepoPath = gitUrlPathWithNoSlashAtTheStart.split("/").slice(0, -1).join("/");

    return {
      ...baseDefaults,
      [CODEBASE_FORM_NAMES.GIT_SERVER]: currentElement?.spec.gitServer || "",
      [CODEBASE_FORM_NAMES.GIT_REPO_PATH]: gitRepoPath,
      [CODEBASE_FORM_NAMES.NAME]: currentElement?.metadata.name || "",
    };
  }, [currentElement, firstValidGitServer?.metadata.name, isPlaceholder]);
};
