import {
  DefaultBranch,
  DeploymentScript,
  CodebaseVersioning,
  CommitMessagePattern,
  JiraServerIntegration,
  JiraServer,
  TicketNamePattern,
  AdvancedJiraMapping,
} from "@/modules/platform/codebases/dialogs/ManageCodebase/components/fields";
import { CodemieIntegration } from "@/modules/platform/codebases/dialogs/ManageCodebase/components/fields/CodemieIntegration";
import { useTypedFormContext } from "@/modules/platform/codebases/dialogs/ManageCodebase/hooks/useFormContext";
import { CODEBASE_FORM_NAMES } from "@/modules/platform/codebases/dialogs/ManageCodebase/names";
import { Grid } from "@mui/material";
import { codebaseType } from "@my-project/shared";

export const Advanced = () => {
  const { watch } = useTypedFormContext();

  const hasJiraServerIntegrationFieldValue = watch(CODEBASE_FORM_NAMES.hasJiraServerIntegration.name);

  const codebaseTypeFieldValue = watch(CODEBASE_FORM_NAMES.type.name);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <DefaultBranch />
      </Grid>
      {codebaseTypeFieldValue === codebaseType.application && (
        <Grid item xs={12}>
          <DeploymentScript />
        </Grid>
      )}
      <Grid item xs={12}>
        <CodebaseVersioning />
      </Grid>
      <Grid item xs={12}>
        <CommitMessagePattern />
      </Grid>
      <Grid item xs={12}>
        <JiraServerIntegration />
      </Grid>
      <Grid item xs={12}>
        <CodemieIntegration />
      </Grid>

      {hasJiraServerIntegrationFieldValue ? (
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
