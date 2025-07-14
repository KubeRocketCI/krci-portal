import React from "react";
import { CDPIPELINE_FORM_NAMES } from "../../../names";
import { useCurrentDialog } from "../../../providers/CurrentDialog/hooks";

export const useDefaultValues = () => {
  const {
    props: { CDPipeline },
  } = useCurrentDialog();

  return React.useMemo(
    () => ({
      [CDPIPELINE_FORM_NAMES.namespace.name]: CDPipeline?.metadata.namespace,
      [CDPIPELINE_FORM_NAMES.description.name]: CDPipeline?.spec.description,
      [CDPIPELINE_FORM_NAMES.applications.name]: CDPipeline?.spec.applications,
      [CDPIPELINE_FORM_NAMES.applicationsToPromote.name]: CDPipeline?.spec.applicationsToPromote,
      [CDPIPELINE_FORM_NAMES.inputDockerStreams.name]: CDPipeline?.spec.inputDockerStreams,
      [CDPIPELINE_FORM_NAMES.applicationsToAddChooser.name]: CDPipeline?.spec.applications.map((app) => app),
      [CDPIPELINE_FORM_NAMES.applicationsToPromoteAll.name]: !!CDPipeline?.spec.applicationsToPromote?.length,
      [CDPIPELINE_FORM_NAMES.applicationsFieldArray.name]: CDPipeline?.spec.applications.map((app, idx) => ({
        appName: app,
        appBranch: {
          label: CDPipeline?.spec.inputDockerStreams[idx],
          value: CDPipeline?.spec.inputDockerStreams[idx],
        },
        appToPromote: (CDPipeline?.spec?.applicationsToPromote || []).includes(app),
      })),
    }),
    [
      CDPipeline?.metadata.namespace,
      CDPipeline?.spec.applications,
      CDPipeline?.spec.applicationsToPromote,
      CDPipeline?.spec.description,
      CDPipeline?.spec.inputDockerStreams,
    ]
  );
};
