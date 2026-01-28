import React from "react";
import { useStore } from "@tanstack/react-form";
import { useJiraServerWatchList } from "@/k8s/api/groups/KRCI/JiraServer";
import { useEditCodebaseForm } from "../providers/form/hooks";
import { EDIT_CODEBASE_FORM_NAMES } from "../types";
import {
  CommitMessagePattern,
  JiraServerIntegration,
  JiraServer,
  TicketNamePattern,
  AdvancedJiraMapping,
} from "./fields";

export const FormContent: React.FC = () => {
  const form = useEditCodebaseForm();

  // Subscribe to hasJiraServerIntegration field value (replaces watch)
  const hasJiraServerIntegration = useStore(
    form.store,
    (state) => state.values[EDIT_CODEBASE_FORM_NAMES.hasJiraServerIntegration]
  );

  const jiraServerListWatch = useJiraServerWatchList();
  const jiraServerList = jiraServerListWatch.data.array;
  const jiraServerNames = jiraServerList.map((jiraServer) => jiraServer.metadata.name);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <CommitMessagePattern />
      </div>
      <div>
        <JiraServerIntegration />
      </div>

      {jiraServerNames.length && hasJiraServerIntegration ? (
        <>
          <div>
            <JiraServer />
          </div>
          <div>
            <TicketNamePattern />
          </div>
          <div>
            <AdvancedJiraMapping />
          </div>
        </>
      ) : null}
    </div>
  );
};
