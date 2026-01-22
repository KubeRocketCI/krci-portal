import { cdPipelineDeploymentType } from "@my-project/shared";
import React from "react";
import { NAMES } from "../names";
import { CreateCDPipelineFormValues } from "../types";
import { routeCDPipelineCreate } from "../../../route";

export const useDefaultValues = (): Partial<CreateCDPipelineFormValues> => {
  const searchParams = routeCDPipelineCreate.useSearch();
  const preselectedApp = React.useMemo(() => {
    const search = searchParams as Record<string, unknown>;
    return typeof search?.application === "string" ? search.application : undefined;
  }, [searchParams]);

  return React.useMemo(() => {
    const defaultApplications = preselectedApp ? [preselectedApp] : [];
    const defaultApplicationsFieldArray = preselectedApp
      ? [{ appName: preselectedApp, appBranch: "", appToPromote: false }]
      : [];

    return {
      [NAMES.applications]: defaultApplications,
      [NAMES.applicationsToPromote]: [],
      [NAMES.inputDockerStreams]: [],
      [NAMES.deploymentType]: cdPipelineDeploymentType.container,
      [NAMES.ui_applicationsToAddChooser]: defaultApplications,
      [NAMES.ui_applicationsFieldArray]: defaultApplicationsFieldArray,
      [NAMES.ui_applicationsToPromoteAll]: false,
    };
  }, [preselectedApp]);
};
