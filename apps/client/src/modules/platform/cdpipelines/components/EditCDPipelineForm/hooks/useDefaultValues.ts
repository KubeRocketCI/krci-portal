import React from "react";
import { CDPipeline } from "@my-project/shared";
import { EDIT_CDPIPELINE_FORM_NAMES } from "../constants";
import { buildInitialApplicationBranches } from "../utils/buildInitialApplicationBranches";
import type { EditCDPipelineFormValues } from "../types";

export const useDefaultValues = (cdPipeline: CDPipeline | undefined) => {
  return React.useMemo<EditCDPipelineFormValues>(() => {
    const applications = cdPipeline?.spec.applications ?? [];
    const inputDockerStreams = cdPipeline?.spec.inputDockerStreams ?? [];
    const applicationsToPromote = cdPipeline?.spec.applicationsToPromote ?? [];

    // Match branches to apps using substring matching (branch names start with app names).
    // This allows branches to be at any index in inputDockerStreams.
    const applicationsFieldArray = buildInitialApplicationBranches(applications, inputDockerStreams);

    // Rebuild inputDockerStreams from the field array to ensure 1:1 index alignment
    const alignedInputDockerStreams = applicationsFieldArray.map((item) => item.appBranch);

    return {
      [EDIT_CDPIPELINE_FORM_NAMES.description]: cdPipeline?.spec.description ?? "",
      [EDIT_CDPIPELINE_FORM_NAMES.applications]: applications,
      [EDIT_CDPIPELINE_FORM_NAMES.applicationsToPromote]: applicationsToPromote,
      [EDIT_CDPIPELINE_FORM_NAMES.inputDockerStreams]: alignedInputDockerStreams,
      [EDIT_CDPIPELINE_FORM_NAMES.ui_applicationsToAddChooser]: applications,
      [EDIT_CDPIPELINE_FORM_NAMES.ui_applicationsToPromoteAll]: applicationsToPromote.length > 0,
      [EDIT_CDPIPELINE_FORM_NAMES.ui_applicationsFieldArray]: applicationsFieldArray,
    };
  }, [
    cdPipeline?.spec.applications,
    cdPipeline?.spec.applicationsToPromote,
    cdPipeline?.spec.description,
    cdPipeline?.spec.inputDockerStreams,
  ]);
};
