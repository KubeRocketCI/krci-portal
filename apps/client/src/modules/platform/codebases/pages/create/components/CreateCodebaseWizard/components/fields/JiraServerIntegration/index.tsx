import React from "react";
import { useStore } from "@tanstack/react-form";
import { useJiraServerWatchList } from "@/k8s/api/groups/KRCI/JiraServer";
import { Alert } from "@/core/components/ui/alert";
import { useCreateCodebaseForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";
import { JiraServer } from "../JiraServer";
import { TicketNamePattern } from "../TicketNamePattern";
import { AdvancedJiraMapping } from "../AdvancedJiraMapping";

export const JiraServerIntegration: React.FC = () => {
  const form = useCreateCodebaseForm();
  const hasJiraServerIntegration = useStore(form.store, (s) => s.values[NAMES.ui_hasJiraServerIntegration] ?? false);

  const jiraServerListWatch = useJiraServerWatchList();
  const jiraServerList = jiraServerListWatch.data.array;
  const hasNoJiraServers = !jiraServerList.length;

  return (
    <div className={hasNoJiraServers ? "flex gap-4" : "w-full"}>
      {hasNoJiraServers && (
        <div className="w-1/2">
          <Alert variant="default">There are no available Jira servers</Alert>
        </div>
      )}
      <div className={hasNoJiraServers ? "w-1/2" : "w-full"}>
        <form.AppField name={NAMES.ui_hasJiraServerIntegration}>
          {(field) => (
            <field.FormSwitch
              label="Integrate with Jira server"
              helperText="Enable this to integrate with Jira server. This will allow you to create Jira issues from the codebase."
              disabled={jiraServerListWatch.isEmpty}
              rich
              expandableContent={
                hasJiraServerIntegration ? (
                  <div className="flex flex-col gap-4">
                    <JiraServer />
                    <TicketNamePattern />
                    <AdvancedJiraMapping />
                  </div>
                ) : null
              }
            />
          )}
        </form.AppField>
      </div>
    </div>
  );
};
