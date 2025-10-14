import { DialogProps } from "@/core/providers/Dialog/types";
import {
  Codebase,
  CodebaseCreationStrategy,
  CodebaseDeploymentScript,
  CodebaseType,
  CodebaseVersioning,
  CITool,
} from "@my-project/shared";
import { NAMES } from "./names";

export type ManageCodebaseDialogProps = DialogProps<{
  codebase?: Codebase;
}>;

export interface CodebaseAuthData {
  repositoryLogin: string;
  repositoryPasswordOrApiToken: string;
}

export type ManageCodebaseFormValues = {
  [NAMES.TYPE]: CodebaseType;
  [NAMES.STRATEGY]: CodebaseCreationStrategy;
  [NAMES.REPOSITORY_URL]: string;
  [NAMES.GIT_SERVER]: string;
  [NAMES.GIT_URL_PATH]: string;
  [NAMES.EMPTY_PROJECT]: boolean;
  [NAMES.PRIVATE]: boolean;
  [NAMES.NAME]: string;
  [NAMES.NAMESPACE]: string;
  [NAMES.DESCRIPTION]: string;
  [NAMES.DEFAULT_BRANCH]: string;
  [NAMES.LANG]: string;
  [NAMES.FRAMEWORK]: string;
  [NAMES.BUILD_TOOL]: string;
  [NAMES.TEST_REPORT_FRAMEWORK]: string;
  [NAMES.VERSIONING_TYPE]: CodebaseVersioning;
  [NAMES.VERSIONING_START_FROM]: string;
  [NAMES.DEPLOYMENT_SCRIPT]: CodebaseDeploymentScript;
  [NAMES.CI_TOOL]: CITool;
  [NAMES.JIRA_SERVER]: string;
  [NAMES.COMMIT_MESSAGE_PATTERN]: string;
  [NAMES.TICKET_NAME_PATTERN]: string;
  [NAMES.JIRA_ISSUE_METADATA_PAYLOAD]: string;
  [NAMES.CODEMIE_INTEGRATION_LABEL]: string;
  [NAMES.HAS_CODEBASE_AUTH]: boolean;
  [NAMES.REPOSITORY_LOGIN]: string;
  [NAMES.REPOSITORY_PASSWORD_OR_API_TOKEN]: string;
  [NAMES.HAS_JIRA_SERVER_INTEGRATION]: boolean;
  [NAMES.HAS_CODEMIE_INTEGRATION]: boolean;
  [NAMES.VERSIONING_START_FROM_VERSION]: string;
  [NAMES.VERSIONING_START_FROM_SNAPSHOT]: string;
  [NAMES.ADVANCED_MAPPING_FIELD_NAME]: string;
  [NAMES.ADVANCED_MAPPING_JIRA_PATTERN]: string;
  [NAMES.REPOSITORY_NAME]: string;
  [NAMES.REPOSITORY_OWNER]: string;
};
