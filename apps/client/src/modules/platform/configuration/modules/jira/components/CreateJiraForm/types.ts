import type { JiraServer } from "@my-project/shared";

export interface CreateJiraFormProps {
  jiraServer: JiraServer | undefined;
  onClose: () => void;
}

export type { CreateJiraFormValues } from "./schema";
