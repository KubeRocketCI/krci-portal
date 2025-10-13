import React from "react";
import { CODEBASE_FROM_TEMPLATE_FORM_NAMES } from "../names";
import { useGitServerWatchList } from "@/k8s/api/groups/KRCI/GitServer";
import { codebaseCreationStrategy, codebaseVersioning, Template } from "@my-project/shared";

const defaultBranchName = "main";
const defaultEDPVersioningValue = "0.1.0-SNAPSHOT";
const [defaultEDPVersioningVersion, defaultEDPVersioningVersionPostfix] = defaultEDPVersioningValue.split("-");

export const useDefaultValues = (template: Template) => {
  const gitServersWatch = useGitServerWatchList();
  const gitServers = gitServersWatch.dataArray;
  const firstValidGitServer = gitServers?.find((gitServer) => gitServer?.status?.connected);

  return React.useMemo(() => {
    return {
      [CODEBASE_FROM_TEMPLATE_FORM_NAMES.LANG]: template?.spec.language,
      [CODEBASE_FROM_TEMPLATE_FORM_NAMES.FRAMEWORK]: template?.spec.framework,
      [CODEBASE_FROM_TEMPLATE_FORM_NAMES.BUILD_TOOL]: template?.spec.buildTool,
      [CODEBASE_FROM_TEMPLATE_FORM_NAMES.TYPE]: template?.spec.type,
      [CODEBASE_FROM_TEMPLATE_FORM_NAMES.REPOSITORY_URL]: template?.spec.source,
      [CODEBASE_FROM_TEMPLATE_FORM_NAMES.STRATEGY]: codebaseCreationStrategy.clone,
      [CODEBASE_FROM_TEMPLATE_FORM_NAMES.DEFAULT_BRANCH]: defaultBranchName,
      [CODEBASE_FROM_TEMPLATE_FORM_NAMES.VERSIONING_TYPE]: codebaseVersioning.semver,
      [CODEBASE_FROM_TEMPLATE_FORM_NAMES.EMPTY_PROJECT]: false,
      [CODEBASE_FROM_TEMPLATE_FORM_NAMES.PRIVATE]: true,
      [CODEBASE_FROM_TEMPLATE_FORM_NAMES.GIT_SERVER]: firstValidGitServer?.metadata.name || "",
      [CODEBASE_FROM_TEMPLATE_FORM_NAMES.VERSIONING_START_FROM]: defaultEDPVersioningValue,
      [CODEBASE_FROM_TEMPLATE_FORM_NAMES.VERSIONING_START_FROM_VERSION]: defaultEDPVersioningVersion,
      [CODEBASE_FROM_TEMPLATE_FORM_NAMES.VERSIONING_START_FROM_POSTFIX]: defaultEDPVersioningVersionPostfix,
    };
  }, [
    template?.spec.language,
    template?.spec.framework,
    template?.spec.buildTool,
    template?.spec.type,
    template?.spec.source,
    firstValidGitServer?.metadata.name,
  ]);
};
