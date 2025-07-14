import React from "react";
import { CDPIPELINE_FORM_NAMES } from "../../../names";
import { cdPipelineDeploymentType } from "@my-project/shared";

export const useDefaultValues = () => {
  return React.useMemo(
    () => ({
      [CDPIPELINE_FORM_NAMES.applications.name]: [],
      [CDPIPELINE_FORM_NAMES.applicationsToPromote.name]: [],
      [CDPIPELINE_FORM_NAMES.inputDockerStreams.name]: [],
      [CDPIPELINE_FORM_NAMES.deploymentType.name]: cdPipelineDeploymentType.container,
      [CDPIPELINE_FORM_NAMES.applicationsToAddChooser.name]: [],
      [CDPIPELINE_FORM_NAMES.applicationsFieldArray.name]: [],
      [CDPIPELINE_FORM_NAMES.applicationsToPromoteAll.name]: true,
    }),
    []
  );
};
