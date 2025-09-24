import { ValueOf } from "@/core/types/global";
import { JiraServer, Secret } from "@my-project/shared";
import { FORM_NAMES, INTEGRATION_SECRET_FORM_NAMES, JIRA_SERVER_FORM_NAMES } from "./constants";

export type FormNames = ValueOf<typeof FORM_NAMES>;

export type JiraServerFormValues = {
  [JIRA_SERVER_FORM_NAMES.URL]: string;
};

export type IntegrationSecretFormValues = {
  [INTEGRATION_SECRET_FORM_NAMES.USERNAME]: string;
  [INTEGRATION_SECRET_FORM_NAMES.PASSWORD]: string;
};

export interface ManageJiraServerCIProps {
  secret: Secret | undefined;
  jiraServer: JiraServer | undefined;
  ownerReference: string | undefined;
  handleClosePanel?: () => void;
}
