import React from "react";
import { Codebase } from "@my-project/shared";
import { EDIT_CODEBASE_FORM_NAMES, EditCodebaseFormValues, MappingRow } from "../types";

// Convert JSON string to array format for mapping rows
const getJiraIssueMetadataPayloadDefaultValue = (jsonFieldValue: string | undefined | null): MappingRow[] => {
  if (!jsonFieldValue) {
    return [];
  }

  try {
    const fieldValues: { [key: string]: string } = JSON.parse(jsonFieldValue);
    return Object.entries(fieldValues).map(([field, pattern]) => ({
      field,
      pattern,
    }));
  } catch {
    return [];
  }
};

export const useDefaultValues = (codebase: Codebase | undefined): EditCodebaseFormValues => {
  const mappingRows = getJiraIssueMetadataPayloadDefaultValue(codebase?.spec.jiraIssueMetadataPayload);

  return React.useMemo(
    (): EditCodebaseFormValues => ({
      [EDIT_CODEBASE_FORM_NAMES.commitMessagePattern]: codebase?.spec.commitMessagePattern || "",
      [EDIT_CODEBASE_FORM_NAMES.hasJiraServerIntegration]: !!codebase?.spec.jiraServer,
      [EDIT_CODEBASE_FORM_NAMES.jiraServer]: codebase?.spec.jiraServer || null,
      [EDIT_CODEBASE_FORM_NAMES.ticketNamePattern]: codebase?.spec.ticketNamePattern || null,
      [EDIT_CODEBASE_FORM_NAMES.jiraIssueMetadataPayload]: codebase?.spec.jiraIssueMetadataPayload || null,
      [EDIT_CODEBASE_FORM_NAMES.advancedMappingRows]: mappingRows,
      [EDIT_CODEBASE_FORM_NAMES.advancedMappingFieldName]: mappingRows.map(({ field }) => field),
    }),
    [codebase, mappingRows]
  );
};
