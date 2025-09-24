import {
  CITool,
  Codebase,
  CodebaseCreationStrategy,
  CodebaseDeploymentScript,
  CodebaseVersioning,
  CodebaseType,
} from "@my-project/shared";
import { CODEBASE_FORM_NAMES } from "./names";

export interface ManageGitOpsDataContext {
  currentElement: Codebase | "placeholder";
  isReadOnly?: boolean;
  handleClosePlaceholder?: () => void;
}

export interface ManageGitOpsProps {
  formData: ManageGitOpsDataContext;
}

export type ManageGitOpsValues = {
  [CODEBASE_FORM_NAMES.TYPE]: CodebaseType;
  [CODEBASE_FORM_NAMES.STRATEGY]: CodebaseCreationStrategy;
  [CODEBASE_FORM_NAMES.GIT_SERVER]: string;
  [CODEBASE_FORM_NAMES.GIT_URL_PATH]: string;
  [CODEBASE_FORM_NAMES.EMPTY_PROJECT]: boolean;
  [CODEBASE_FORM_NAMES.NAME]: string;
  [CODEBASE_FORM_NAMES.NAMESPACE]: string;
  [CODEBASE_FORM_NAMES.DESCRIPTION]: string;
  [CODEBASE_FORM_NAMES.DEFAULT_BRANCH]: string;
  [CODEBASE_FORM_NAMES.LANG]: string;
  [CODEBASE_FORM_NAMES.FRAMEWORK]: string;
  [CODEBASE_FORM_NAMES.BUILD_TOOL]: string;
  [CODEBASE_FORM_NAMES.VERSIONING_TYPE]: CodebaseVersioning;
  [CODEBASE_FORM_NAMES.VERSIONING_START_FROM]: string;
  [CODEBASE_FORM_NAMES.DEPLOYMENT_SCRIPT]: CodebaseDeploymentScript;
  [CODEBASE_FORM_NAMES.CI_TOOL]: CITool;
  [CODEBASE_FORM_NAMES.GIT_REPO_PATH]: string;
  [CODEBASE_FORM_NAMES.SYSTEM_TYPE_LABEL]: string;
};
