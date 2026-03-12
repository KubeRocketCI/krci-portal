import React from "react";
import { Actions } from "./components/Actions";
import { JiraServerForm } from "./components/JiraServer";
import { SecretForm } from "./components/Secret";
import { DataContextProvider } from "./providers/Data";
import { ManageJiraServerFormProvider } from "./providers/form/provider";
import { ManageJiraServerCIProps } from "./types";
import { ManageJiraServerFormValues, NAMES } from "./names";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { safeDecode } from "@my-project/shared";
import { toast } from "sonner";
import { Separator } from "@/core/components/ui/separator";
import { getJiraServerStatusIcon } from "@/k8s/api/groups/KRCI/JiraServer";
import { IntegrationFormContent } from "../../../../components/IntegrationFormContent";

/**
 * Rendered inside ManageJiraServerFormProvider so it has access to the form via useManageJiraServerForm().
 * In edit mode wraps everything in an accordion (with delete in the trigger); in create mode renders the form fields directly.
 */
const FormContent = ({
  secret,
  jiraServer,
  ownerReference,
}: Pick<ManageJiraServerCIProps, "secret" | "jiraServer" | "ownerReference">) => {
  const formFields = (
    <div className="flex flex-col gap-4">
      <JiraServerForm />
      <Separator />
      <SecretForm />
      <Separator />
      <Actions />
    </div>
  );

  if (!secret || !jiraServer) {
    return formFields;
  }

  const status = jiraServer.status?.status;
  const statusIcon = getJiraServerStatusIcon(jiraServer);

  return (
    <IntegrationFormContent
      serviceLabel="Jira Server"
      secret={secret}
      ownerReference={ownerReference}
      statusIcon={statusIcon}
      statusTooltip={
        <>
          <p className="text-sm font-semibold">{`Status: ${status === undefined ? "Unknown" : status}`}</p>
          {!!jiraServer.status?.detailed_message && (
            <p className="mt-3 text-sm font-medium">{jiraServer.status.detailed_message}</p>
          )}
        </>
      }
    >
      {formFields}
    </IntegrationFormContent>
  );
};

export const ManageJiraServer = ({ jiraServer, secret, ownerReference, handleClosePanel }: ManageJiraServerCIProps) => {
  const trpc = useTRPCClient();
  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );

  const defaultValues = React.useMemo<Partial<ManageJiraServerFormValues>>(() => {
    return {
      [NAMES.URL]: jiraServer?.spec?.apiUrl || jiraServer?.spec?.rootUrl || "",
      [NAMES.USERNAME]: safeDecode(secret?.data?.username ?? "", ""),
      [NAMES.PASSWORD]: safeDecode(secret?.data?.password ?? "", ""),
    };
  }, [jiraServer, secret]);

  const handleSubmit = React.useCallback(
    async (values: ManageJiraServerFormValues) => {
      try {
        const mode = secret && jiraServer ? "edit" : "create";
        const initialUrl = jiraServer?.spec?.apiUrl || jiraServer?.spec?.rootUrl || "";
        const initialUsername = safeDecode(secret?.data?.username ?? "", "");
        const initialPassword = safeDecode(secret?.data?.password ?? "", "");

        const result = await trpc.k8s.manageJiraIntegration.mutate({
          clusterName,
          namespace: defaultNamespace,
          mode,
          dirtyFields: {
            jiraServer: mode === "create" || values.url !== initialUrl,
            secret: mode === "create" || values.username !== initialUsername || values.password !== initialPassword,
            quickLink: false,
          },
          jiraServer: {
            url: values.url,
            currentResource: jiraServer,
          },
          secret: {
            username: values.username,
            password: values.password,
            currentResource: secret,
          },
        });

        if (!result.success) {
          throw new Error("Failed to save Jira integration");
        }

        toast.success(result.data?.message || "Jira integration saved successfully");
        handleClosePanel?.();
      } catch (error) {
        console.error("Failed to save Jira integration:", error);
        toast.error(error instanceof Error ? error.message : "Failed to save Jira integration");
        throw error;
      }
    },
    [clusterName, defaultNamespace, jiraServer, secret, trpc, handleClosePanel]
  );

  const handleSubmitError = React.useCallback((error: unknown) => {
    console.error("Form submission error:", error);
  }, []);

  return (
    <div data-testid="form">
      <DataContextProvider
        secret={secret}
        jiraServer={jiraServer}
        ownerReference={ownerReference}
        handleClosePanel={handleClosePanel}
      >
        <ManageJiraServerFormProvider
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          onSubmitError={handleSubmitError}
        >
          <FormContent secret={secret} jiraServer={jiraServer} ownerReference={ownerReference} />
        </ManageJiraServerFormProvider>
      </DataContextProvider>
    </div>
  );
};
