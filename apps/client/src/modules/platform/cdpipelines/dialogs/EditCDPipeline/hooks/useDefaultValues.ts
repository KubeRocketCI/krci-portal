import React from "react";
import { CDPipeline } from "@my-project/shared";
import { NAMES } from "../../../pages/create/components/CreateCDPipelineWizard/names";

export const useDefaultValues = (cdPipeline: CDPipeline | undefined) => {
  return React.useMemo(
    () => ({
      [NAMES.description]: cdPipeline?.spec.description,
      [NAMES.applications]: cdPipeline?.spec.applications,
      [NAMES.applicationsToPromote]: cdPipeline?.spec.applicationsToPromote,
      [NAMES.inputDockerStreams]: cdPipeline?.spec.inputDockerStreams,
      [NAMES.ui_applicationsToAddChooser]: cdPipeline?.spec.applications.map((app) => app),
      [NAMES.ui_applicationsToPromoteAll]: !!cdPipeline?.spec.applicationsToPromote?.length,
      [NAMES.ui_applicationsFieldArray]: cdPipeline?.spec.applications.map((app, idx) => ({
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
