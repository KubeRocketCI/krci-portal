import { cdPipelineDeploymentType } from "@my-project/shared";
import React from "react";
import { NAMES } from "../names";
import { CreateCDPipelineFormValues } from "../types";
import { routeCDPipelineCreate } from "../../../route";

export const useDefaultValues = (): Partial<CreateCDPipelineFormValues> => {
  // Safely get search params - fallback to empty object if route is not active (e.g., in Storybook)
  let searchParams: Record<string, unknown> = {};
  try {
    searchParams = routeCDPipelineCreate.useSearch() as Record<string, unknown>;
  } catch {
    // Route not active - use empty search params
  }

  const preselectedApp = typeof searchParams?.application === "string" ? searchParams.application : undefined;

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
