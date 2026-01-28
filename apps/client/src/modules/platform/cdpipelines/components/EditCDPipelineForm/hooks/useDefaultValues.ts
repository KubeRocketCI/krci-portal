import React from "react";
import { CDPipeline } from "@my-project/shared";
import { EDIT_CDPIPELINE_FORM_NAMES } from "../constants";

export const useDefaultValues = (cdPipeline: CDPipeline | undefined) => {
  return React.useMemo(
    () => ({
      [EDIT_CDPIPELINE_FORM_NAMES.description]: cdPipeline?.spec.description,
      [EDIT_CDPIPELINE_FORM_NAMES.applications]: cdPipeline?.spec.applications,
      [EDIT_CDPIPELINE_FORM_NAMES.applicationsToPromote]: cdPipeline?.spec.applicationsToPromote,
      [EDIT_CDPIPELINE_FORM_NAMES.inputDockerStreams]: cdPipeline?.spec.inputDockerStreams,
      [EDIT_CDPIPELINE_FORM_NAMES.ui_applicationsToAddChooser]: cdPipeline?.spec.applications.map((app) => app),
      [EDIT_CDPIPELINE_FORM_NAMES.ui_applicationsToPromoteAll]: !!cdPipeline?.spec.applicationsToPromote?.length,
      [EDIT_CDPIPELINE_FORM_NAMES.ui_applicationsFieldArray]: cdPipeline?.spec.applications.map((app, idx) => ({
        appName: app,
        appBranch: cdPipeline?.spec.inputDockerStreams[idx],
        appToPromote: (cdPipeline?.spec?.applicationsToPromote || []).includes(app),
      })),
    }),
    [
      cdPipeline?.spec.applications,
      cdPipeline?.spec.applicationsToPromote,
      cdPipeline?.spec.description,
      cdPipeline?.spec.inputDockerStreams,
    ]
  );
};
