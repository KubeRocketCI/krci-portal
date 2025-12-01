import React from "react";
import { Codebase } from "@my-project/shared";
import { EDIT_FORM_NAMES, NAMES, CREATE_WIZARD_NAMES } from "@/modules/platform/codebases/components/form-fields/names";
import { k8sCodebaseConfig } from "@my-project/shared";
import { getJiraIssueMetadataPayloadDefaultValue } from "../../../components/form-fields/AdvancedJiraMapping/utils";

export const useDefaultValues = (codebase: Codebase | undefined) => {
  const mappingRows = getJiraIssueMetadataPayloadDefaultValue(codebase?.spec.jiraIssueMetadataPayload);

  return React.useMemo(
    () => ({
      [EDIT_FORM_NAMES[NAMES.HAS_JIRA_SERVER_INTEGRATION].name]: !!codebase?.spec.jiraServer,
      [EDIT_FORM_NAMES[NAMES.JIRA_SERVER].name]: codebase?.spec.jiraServer,
      [EDIT_FORM_NAMES[NAMES.COMMIT_MESSAGE_PATTERN].name]: codebase?.spec.commitMessagePattern,
      [EDIT_FORM_NAMES[NAMES.TICKET_NAME_PATTERN].name]: codebase?.spec.ticketNamePattern,
      [EDIT_FORM_NAMES[NAMES.CODEMIE_INTEGRATION_LABEL].name]:
        codebase?.metadata.labels?.[k8sCodebaseConfig.labels.integration],
      [EDIT_FORM_NAMES[NAMES.HAS_CODEMIE_INTEGRATION].name]:
        !!codebase?.metadata.labels?.[k8sCodebaseConfig.labels.integration],
      [EDIT_FORM_NAMES[NAMES.JIRA_ISSUE_METADATA_PAYLOAD].name]: codebase?.spec.jiraIssueMetadataPayload,
      // Advanced mapping rows - convert to array format used by create wizard
      [CREATE_WIZARD_NAMES.ui_advancedMappingRows]: mappingRows.map(({ value, jiraPattern }) => ({
        field: value,
        pattern: jiraPattern,
      })),
      [CREATE_WIZARD_NAMES.ui_advancedMappingFieldName]: mappingRows.map(({ value }) => value),
    }),
    [codebase, mappingRows]
  );
};
