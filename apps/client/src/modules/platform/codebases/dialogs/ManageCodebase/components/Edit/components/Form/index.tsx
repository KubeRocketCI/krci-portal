import { useTypedFormContext } from "../../../../hooks/useFormContext";
import { CODEBASE_FORM_NAMES } from "../../../../names";
import {
  AdvancedJiraMapping,
  CommitMessagePattern,
  JiraServer,
  JiraServerIntegration,
  TicketNamePattern,
} from "../../../fields";
import { CodemieIntegration } from "../../../fields/CodemieIntegration";
import { useJiraServerWatchList } from "@/k8s/api/groups/KRCI/JiraServer";

export const Form = () => {
  const { watch } = useTypedFormContext();

  const jiraServerListWatch = useJiraServerWatchList();
  const jiraServerList = jiraServerListWatch.data.array;
  const jiraServerNames = jiraServerList.map((jiraServer) => jiraServer.metadata.name);

  const hasJiraServerIntegrationFieldValue = watch(CODEBASE_FORM_NAMES.hasJiraServerIntegration.name);

  return (
    <div className="flex flex-col gap-2">
      <div>
        <CommitMessagePattern />
      </div>
      <div>
        <JiraServerIntegration />
      </div>
      <div>
        <CodemieIntegration />
      </div>
      {jiraServerNames.length && hasJiraServerIntegrationFieldValue ? (
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
