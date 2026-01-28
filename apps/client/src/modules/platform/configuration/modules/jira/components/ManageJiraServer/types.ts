import { JiraServer, Secret } from "@my-project/shared";

export interface ManageJiraServerCIProps {
  secret: Secret | undefined;
  jiraServer: JiraServer | undefined;
  ownerReference: string | undefined;
  handleClosePanel?: () => void;
}

export type { ManageJiraServerFormValues } from "./names";
