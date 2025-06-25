import React from "react";
import { CODEBASE_FORM_NAMES } from "../../../names";
import { useCurrentDialog } from "../../../providers/CurrentDialog/hooks";
import { createAdvancedMappingRowName } from "../../fields/AdvancedJiraMapping/constants";
import { getJiraIssueMetadataPayloadDefaultValue } from "../../fields/AdvancedJiraMapping/utils";
import { k8sCodebaseConfig } from "@my-project/shared";

export const useDefaultValues = () => {
  const {
    props: { codebase },
  } = useCurrentDialog();

  const mappingRows = getJiraIssueMetadataPayloadDefaultValue(codebase?.spec.jiraIssueMetadataPayload);

  return React.useMemo(
    () => ({
      [CODEBASE_FORM_NAMES.hasJiraServerIntegration.name]: !!codebase?.spec.jiraServer,
      [CODEBASE_FORM_NAMES.namespace.name]: codebase?.metadata.namespace,
      [CODEBASE_FORM_NAMES.jiraServer.name]: codebase?.spec.jiraServer,
      [CODEBASE_FORM_NAMES.commitMessagePattern.name]: codebase?.spec.commitMessagePattern,
      [CODEBASE_FORM_NAMES.ticketNamePattern.name]: codebase?.spec.ticketNamePattern,
      [CODEBASE_FORM_NAMES.codemieIntegrationLabel.name]:
        codebase?.metadata.labels?.[k8sCodebaseConfig.labels.integration],
      [CODEBASE_FORM_NAMES.hasCodemieIntegration.name]:
        !!codebase?.metadata.labels?.[k8sCodebaseConfig.labels.integration],
      [CODEBASE_FORM_NAMES.jiraIssueMetadataPayload.name]: codebase?.spec.jiraIssueMetadataPayload,
      ...mappingRows.reduce(
        (acc, { value, jiraPattern }) => ({
          ...acc,
          [createAdvancedMappingRowName(value)]: jiraPattern,
        }),
        {}
      ),
    }),
    [codebase, mappingRows]
  );
};
