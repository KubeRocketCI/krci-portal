import { Grid } from "@mui/material";
import { Actions } from "./components/Actions";
import { JiraServerForm } from "./components/JiraServer";
import { SecretForm } from "./components/Secret";
import { useJiraServerCreateForm } from "./hooks/useJiraServerCreateForm";
import { useJiraServerEditForm } from "./hooks/useJiraServerEditForm";
import { useSecretCreateForm } from "./hooks/useSecretCreateForm";
import { useSecretEditForm } from "./hooks/useSecretEditForm";
import { DataContextProvider } from "./providers/Data";
import { FormNames, ManageJiraServerCIProps } from "./types";
import { MultiFormContextProvider } from "@/core/providers/MultiForm/provider";

export const ManageJiraServer = ({ jiraServer, secret, ownerReference, handleClosePanel }: ManageJiraServerCIProps) => {
  const secretCreateForm = useSecretCreateForm({ handleClosePanel });

  const secretEditForm = useSecretEditForm({ handleClosePanel, secret });

  const jiraServerEditForm = useJiraServerEditForm({
    jiraServer,
    handleClosePanel,
  });

  const jiraServerCreateForm = useJiraServerCreateForm({ handleClosePanel });

  const jiraServerForm = jiraServer ? jiraServerEditForm : jiraServerCreateForm;

  const secretForm = secret ? secretEditForm : secretCreateForm;

  return (
    <div data-testid="form">
      <DataContextProvider
        secret={secret}
        jiraServer={jiraServer}
        ownerReference={ownerReference}
        handleClosePanel={handleClosePanel}
      >
        <MultiFormContextProvider<FormNames>
          forms={{
            jiraServer: jiraServerForm,
            secret: secretForm,
          }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <JiraServerForm />
            </Grid>
            <Grid item xs={12}>
              <SecretForm />
            </Grid>
            <Grid item xs={12}>
              <Actions />
            </Grid>
          </Grid>
        </MultiFormContextProvider>
      </DataContextProvider>
    </div>
  );
};
