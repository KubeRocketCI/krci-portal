import { Grid } from "@mui/material";
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
  const jiraServerList = jiraServerListWatch.dataArray;
  const jiraServerNames = jiraServerList.map((jiraServer) => jiraServer.metadata.name);

  const hasJiraServerIntegrationFieldValue = watch(CODEBASE_FORM_NAMES.hasJiraServerIntegration.name);

  return (
    <Grid container spacing={1}>
      <Grid item xs={12}>
        <CommitMessagePattern />
      </Grid>
      <Grid item xs={12}>
        <JiraServerIntegration />
      </Grid>
      <Grid item xs={12}>
        <CodemieIntegration />
      </Grid>
      {jiraServerNames.length && hasJiraServerIntegrationFieldValue ? (
        <>
          <Grid item xs={12}>
            <JiraServer />
          </Grid>
          <Grid item xs={12}>
            <TicketNamePattern />
          </Grid>
          <Grid item xs={12}>
            <AdvancedJiraMapping />
          </Grid>
        </>
      ) : null}
    </Grid>
  );
};
