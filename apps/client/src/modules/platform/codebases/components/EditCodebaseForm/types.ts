import { EDIT_CODEBASE_FORM_NAMES } from "./constants";

export { EDIT_CODEBASE_FORM_NAMES } from "./constants";

// Mapping row type for advanced Jira mapping
export interface MappingRow {
  field: string;
  pattern: string;
}

// Form values type for EditCodebase
export interface EditCodebaseFormValues {
  [EDIT_CODEBASE_FORM_NAMES.commitMessagePattern]: string;
  [EDIT_CODEBASE_FORM_NAMES.hasJiraServerIntegration]: boolean;
  [EDIT_CODEBASE_FORM_NAMES.jiraServer]: string | null;
  [EDIT_CODEBASE_FORM_NAMES.ticketNamePattern]: string | null;
  [EDIT_CODEBASE_FORM_NAMES.advancedMappingFieldName]: string[];
  [EDIT_CODEBASE_FORM_NAMES.advancedMappingRows]: MappingRow[];
  [EDIT_CODEBASE_FORM_NAMES.jiraIssueMetadataPayload]: string | null;
}
