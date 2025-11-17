import { JiraServer, JiraServerStatus } from "../../types.js";

export const getJiraServerStatus = (
  jiraServer: JiraServer
): {
  status: JiraServerStatus;
  errorMessage: string | undefined;
} => {
  const status = jiraServer?.status?.status?.toLowerCase() as JiraServerStatus;
  const errorMessage = jiraServer?.status?.detailed_message;

  return {
    status,
    errorMessage,
  };
};
