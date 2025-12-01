import React from "react";
import { useFormContext } from "react-hook-form";
import { EDIT_FORM_NAMES, NAMES } from "@/modules/platform/codebases/components/form-fields";
import {
  CommitMessagePatternField,
  JiraServerIntegrationField,
  JiraServerField,
  TicketNamePatternField,
  AdvancedJiraMappingField,
} from "@/modules/platform/codebases/components/form-fields";
import { useJiraServerWatchList } from "@/k8s/api/groups/KRCI/JiraServer";

export const FormContent: React.FC = () => {
  const { watch } = useFormContext();

  const hasJiraServerIntegration = (watch as (name: string) => boolean)(
    EDIT_FORM_NAMES[NAMES.HAS_JIRA_SERVER_INTEGRATION].name
  );

  const jiraServerListWatch = useJiraServerWatchList();
  const jiraServerList = jiraServerListWatch.data.array;
  const jiraServerNames = jiraServerList.map((jiraServer) => jiraServer.metadata.name);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <CommitMessagePatternField name={EDIT_FORM_NAMES[NAMES.COMMIT_MESSAGE_PATTERN].name} />
      </div>
      <div>
        <JiraServerIntegrationField name={EDIT_FORM_NAMES[NAMES.HAS_JIRA_SERVER_INTEGRATION].name} />
      </div>

      {jiraServerNames.length && hasJiraServerIntegration ? (
        <>
          <div>
            <JiraServerField name={EDIT_FORM_NAMES[NAMES.JIRA_SERVER].name} />
          </div>
          <div>
            <TicketNamePatternField name={EDIT_FORM_NAMES[NAMES.TICKET_NAME_PATTERN].name} />
          </div>
          <div>
            <AdvancedJiraMappingField
              name={EDIT_FORM_NAMES[NAMES.ADVANCED_MAPPING_FIELD_NAME].name}
              advancedMappingPatternName={EDIT_FORM_NAMES[NAMES.ADVANCED_MAPPING_JIRA_PATTERN].name}
            />
          </div>
        </>
      ) : null}
    </div>
  );
};
