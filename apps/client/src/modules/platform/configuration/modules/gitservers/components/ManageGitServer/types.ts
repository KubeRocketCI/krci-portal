import { GitProvider, GitServer } from "@my-project/shared";
import { ValueOf } from "@my-project/shared";
import { FORM_NAMES } from "./constants";
import { CREDENTIALS_FORM_NAMES, GIT_SERVER_FORM_NAMES, SHARED_FORM_NAMES } from "./names";

export type FormNames = Exclude<ValueOf<typeof FORM_NAMES>, typeof FORM_NAMES.SHARED>;

export interface ManageGitServerProps {
  gitServer: GitServer | undefined;
  webhookURL: string | undefined;
  handleClosePanel: (() => void) | undefined;
}

export type SharedFormValues = {
  [SHARED_FORM_NAMES.GIT_PROVIDER]: GitProvider;
  [SHARED_FORM_NAMES.GIT_USER]: string;
};

export type CredentialsFormValues = {
  [CREDENTIALS_FORM_NAMES.SSH_PRIVATE_KEY]: string;
  [CREDENTIALS_FORM_NAMES.SSH_PUBLIC_KEY]: string;
  [CREDENTIALS_FORM_NAMES.TOKEN]: string;
};

export type GitServerFormValues = {
  [GIT_SERVER_FORM_NAMES.NAME]: string;
  [GIT_SERVER_FORM_NAMES.GIT_HOST]: string;
  [GIT_SERVER_FORM_NAMES.GIT_PROVIDER]: GitProvider;
  [GIT_SERVER_FORM_NAMES.GIT_USER]: string;
  [GIT_SERVER_FORM_NAMES.HTTPS_PORT]: number;
  [GIT_SERVER_FORM_NAMES.NAME_SSH_KEY_SECRET]: string;
  [GIT_SERVER_FORM_NAMES.SSH_PORT]: number;
  [GIT_SERVER_FORM_NAMES.SKIP_WEBHOOK_SSL]: boolean;
  [GIT_SERVER_FORM_NAMES.WEBHOOK_URL]: string;
};
