import { Actions } from "./components/Actions";
import { CredentialsForm } from "./components/Credentials";
import { GitServerForm } from "./components/GitServer";
import { useCredentialsCreateForm } from "./hooks/useCredentialsCreateForm";
import { useCredentialsEditForm } from "./hooks/useCredentialsEditForm";
import { useGitServerCreateForm } from "./hooks/useGitServerCreateForm";
import { useGitServerEditForm } from "./hooks/useGitServerEditForm";
import { useSharedForm } from "./hooks/useSharedForm";
import { GIT_SERVER_FORM_NAMES } from "./names";
import { DataContextProvider } from "./providers/Data";
import { FormNames, ManageGitServerProps } from "./types";
import { MultiFormContextProvider } from "@/core/providers/MultiForm/provider";
import { useSecretWatchItem } from "@/k8s/api/groups/Core/Secret";
import { createGitServerSecretName } from "@my-project/shared";

export const ManageGitServer = ({ gitServer, webhookURL, handleClosePanel }: ManageGitServerProps) => {
  const { form: sharedForm } = useSharedForm({ gitServer });
  const gitProviderSharedValue = sharedForm.watch(GIT_SERVER_FORM_NAMES.GIT_PROVIDER);

  const gitServerSecretWatch = useSecretWatchItem({
    name: createGitServerSecretName(gitProviderSharedValue || ""),
  });

  const gitServerSecret = gitServerSecretWatch.query.data;

  const gitServerCreateForm = useGitServerCreateForm({
    handleClosePanel,
  });

  const gitServerEditForm = useGitServerEditForm({ gitServer, webhookURL });

  const credentialsCreateForm = useCredentialsCreateForm({
    sharedForm,
  });

  const credentialsEditForm = useCredentialsEditForm({
    sharedForm,
  });

  const gitServerForm = gitServer ? gitServerEditForm : gitServerCreateForm;
  const credentialsForm = gitServerSecret ? credentialsEditForm : credentialsCreateForm;

  return (
    <div data-testid="form">
      <DataContextProvider gitServer={gitServer} gitServerSecret={gitServerSecret} handleClosePanel={handleClosePanel}>
        <MultiFormContextProvider<FormNames>
          forms={{
            gitServer: gitServerForm,
            credentials: credentialsForm,
          }}
          sharedForm={sharedForm}
        >
          <div className="flex flex-col gap-6">
            <div>
              <GitServerForm />
            </div>
            <div>
              <CredentialsForm />
            </div>
            <div>
              <Actions />
            </div>
          </div>
        </MultiFormContextProvider>
      </DataContextProvider>
    </div>
  );
};
