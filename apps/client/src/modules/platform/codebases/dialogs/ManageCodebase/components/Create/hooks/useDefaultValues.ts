import { K8sGitServer } from "@my-project/client/core/k8s/api/KRCI/GitServer";
import { ciTool, codebaseVersioning } from "@my-project/shared";
import React from "react";
import { CODEBASE_FORM_NAMES } from "../../../names";
import { mapValuesToArray } from "@my-project/client/core/k8s/api/hooks/useWatchList";
import { ManageCodebaseFormValues } from "../../../types";

const defaultEDPVersioningValue = "0.1.0-SNAPSHOT";
const [defaultEDPVersioningVersion, defaultEDPVersioningVersionPostfix] = defaultEDPVersioningValue.split("-");

export const useDefaultValues = (): Partial<ManageCodebaseFormValues> => {
  const gitServers = K8sGitServer.useWatchList();

  return React.useMemo(() => {
    if (gitServers.isLoading) {
      return {};
    }

    const firstValidGitServer = mapValuesToArray(gitServers.data.items).find(
      (gitServer) => gitServer.status?.connected
    );

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
  }, [gitServers.data.items, gitServers.isLoading]);
};
