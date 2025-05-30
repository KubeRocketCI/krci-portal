import { ciTool, codebaseVersioning } from "@my-project/shared";
import React from "react";
import { CODEBASE_FORM_NAMES } from "../../../names";
import { ManageCodebaseFormValues } from "../../../types";
import { useGitServerWatchList } from "@/core/k8s/api/groups/KRCI/GitServer";

const defaultEDPVersioningValue = "0.1.0-SNAPSHOT";
const [defaultEDPVersioningVersion, defaultEDPVersioningVersionPostfix] = defaultEDPVersioningValue.split("-");

export const useDefaultValues = (): Partial<ManageCodebaseFormValues> => {
  const gitServersWatch = useGitServerWatchList();

  return React.useMemo(() => {
    if (gitServersWatch.query.isLoading) {
      return {};
    }

    const firstValidGitServer = gitServersWatch.dataArray.find((gitServer) => gitServer.status?.connected);

    return {
      [CODEBASE_FORM_NAMES.defaultBranch.name]: "main",
      [CODEBASE_FORM_NAMES.emptyProject.name]: false,
      [CODEBASE_FORM_NAMES.private.name]: true,
      [CODEBASE_FORM_NAMES.versioningType.name]: codebaseVersioning.semver,
      [CODEBASE_FORM_NAMES.versioningStartFrom.name]: defaultEDPVersioningValue,
      [CODEBASE_FORM_NAMES.versioningStartFromVersion.name]: defaultEDPVersioningVersion,
      [CODEBASE_FORM_NAMES.versioningStartFromSnapshot.name]: defaultEDPVersioningVersionPostfix,
      [CODEBASE_FORM_NAMES.ciTool.name]: ciTool.tekton,
      [CODEBASE_FORM_NAMES.gitServer.name]: firstValidGitServer?.metadata.name || "",
    };
  }, [gitServersWatch.dataArray, gitServersWatch.query.isLoading]);
};
