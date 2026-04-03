import React from "react";
import { CDPipeline } from "@my-project/shared";
import { EDIT_CDPIPELINE_FORM_NAMES } from "../constants";
import { alignInputDockerStreams } from "../utils/alignInputDockerStreams";
import type { EditCDPipelineFormValues } from "../types";

export const useDefaultValues = (cdPipeline: CDPipeline | undefined) => {
  return React.useMemo<EditCDPipelineFormValues>(() => {
    const applications = cdPipeline?.spec.applications ?? [];
    const inputDockerStreams = alignInputDockerStreams(cdPipeline?.spec.inputDockerStreams, applications.length);
    const applicationsToPromote = cdPipeline?.spec.applicationsToPromote ?? [];

    return {
      [EDIT_CDPIPELINE_FORM_NAMES.description]: cdPipeline?.spec.description ?? "",
      [EDIT_CDPIPELINE_FORM_NAMES.applications]: applications,
      [EDIT_CDPIPELINE_FORM_NAMES.applicationsToPromote]: applicationsToPromote,
      [EDIT_CDPIPELINE_FORM_NAMES.inputDockerStreams]: inputDockerStreams,
      [EDIT_CDPIPELINE_FORM_NAMES.ui_applicationsToAddChooser]: applications,
      [EDIT_CDPIPELINE_FORM_NAMES.ui_applicationsToPromoteAll]: applicationsToPromote.length > 0,
      [EDIT_CDPIPELINE_FORM_NAMES.ui_applicationsFieldArray]: applications.map((app, idx) => ({
        appName: app,
        appBranch: inputDockerStreams[idx] ?? "",
      })),
    };
  }, [
    cdPipeline?.spec.applications,
    cdPipeline?.spec.applicationsToPromote,
    cdPipeline?.spec.description,
    cdPipeline?.spec.inputDockerStreams,
  ]);
};
