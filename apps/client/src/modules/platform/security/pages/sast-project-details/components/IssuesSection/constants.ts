import { SONARQUBE_ISSUE_TYPES, SonarQubeIssueType } from "../../../sast/constants";

/**
 * Issues section constants
 */

/**
 * Re-export centralized SonarQube issue types
 */
export const ISSUE_TYPES = SONARQUBE_ISSUE_TYPES;
export type IssueTypeTab = SonarQubeIssueType;

/**
 * Issue type tabs configuration
 */
export const ISSUE_TYPE_TABS = [
  { value: ISSUE_TYPES.ALL, label: "All Issues" },
  { value: ISSUE_TYPES.BUG, label: "Bugs" },
  { value: ISSUE_TYPES.VULNERABILITY, label: "Vulnerabilities" },
  { value: ISSUE_TYPES.CODE_SMELL, label: "Code Smells" },
] as const;

/**
 * Issues per page (matches SAST projects table)
 */
export const ISSUES_PAGE_SIZE = 25;
