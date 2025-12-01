import { NAMES as CREATE_NAMES } from "../../pages/create/components/CreateCodebaseWizard/names";

// Re-export NAMES from create wizard for consistency (lowercase field names)
export const CREATE_WIZARD_NAMES = CREATE_NAMES;

// NAMES constants with uppercase keys (for compatibility with edit form)
// These map to the actual field names from the create wizard
export const NAMES = {
  COMMIT_MESSAGE_PATTERN: "COMMIT_MESSAGE_PATTERN",
  HAS_JIRA_SERVER_INTEGRATION: "HAS_JIRA_SERVER_INTEGRATION",
  JIRA_SERVER: "JIRA_SERVER",
  TICKET_NAME_PATTERN: "TICKET_NAME_PATTERN",
  ADVANCED_MAPPING_FIELD_NAME: "ADVANCED_MAPPING_FIELD_NAME",
  ADVANCED_MAPPING_JIRA_PATTERN: "ADVANCED_MAPPING_JIRA_PATTERN",
  JIRA_ISSUE_METADATA_PAYLOAD: "JIRA_ISSUE_METADATA_PAYLOAD",
  HAS_CODEMIE_INTEGRATION: "HAS_CODEMIE_INTEGRATION",
  CODEMIE_INTEGRATION_LABEL: "CODEMIE_INTEGRATION_LABEL",
} as const;

// Edit form names - only fields that can be edited
// Maps constant keys to actual field names from create wizard
export const EDIT_FORM_NAMES = {
  [NAMES.COMMIT_MESSAGE_PATTERN]: {
    name: CREATE_WIZARD_NAMES.commitMessagePattern,
  },
  [NAMES.HAS_JIRA_SERVER_INTEGRATION]: {
    name: CREATE_WIZARD_NAMES.ui_hasJiraServerIntegration,
  },
  [NAMES.JIRA_SERVER]: {
    name: CREATE_WIZARD_NAMES.jiraServer,
  },
  [NAMES.TICKET_NAME_PATTERN]: {
    name: CREATE_WIZARD_NAMES.ticketNamePattern,
  },
  [NAMES.ADVANCED_MAPPING_FIELD_NAME]: {
    name: CREATE_WIZARD_NAMES.ui_advancedMappingFieldName,
  },
  [NAMES.ADVANCED_MAPPING_JIRA_PATTERN]: {
    name: CREATE_WIZARD_NAMES.ui_advancedMappingJiraPattern,
  },
  [NAMES.JIRA_ISSUE_METADATA_PAYLOAD]: {
    name: CREATE_WIZARD_NAMES.jiraIssueMetadataPayload,
  },
  [NAMES.HAS_CODEMIE_INTEGRATION]: {
    name: CREATE_WIZARD_NAMES.ui_hasCodemieIntegration,
  },
  [NAMES.CODEMIE_INTEGRATION_LABEL]: {
    name: "codemieIntegrationLabel", // Special case - stored in metadata.labels
  },
} as const;
