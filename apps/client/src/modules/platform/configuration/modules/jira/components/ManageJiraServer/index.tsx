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
import { safeDecode, k8sSecretConfig } from "@my-project/shared";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/core/components/ui/accordion";
import { StatusIcon } from "@/core/components/StatusIcon";
import { Tooltip } from "@/core/components/ui/tooltip";
import { ShieldX, Trash } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { ConditionalWrapper } from "@/core/components/ConditionalWrapper";
import { getJiraServerStatusIcon } from "@/k8s/api/groups/KRCI/JiraServer";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { DeleteKubeObjectDialog } from "@/core/components/DeleteKubeObject";
import { useSecretPermissions } from "@/k8s/api/groups/Core/Secret";

/**
 * Rendered inside ManageJiraServerFormProvider so it has access to the form via useManageJiraServerForm().
 * In edit mode wraps everything in an accordion (with delete in the trigger); in create mode renders the form fields directly.
 */
const FormContent = ({
  secret,
  jiraServer,
  ownerReference,
}: Pick<ManageJiraServerCIProps, "secret" | "jiraServer" | "ownerReference">) => {
  // Delete logic (lives here because the button is in the accordion trigger)
  const openDeleteKubeObjectDialog = useDialogOpener(DeleteKubeObjectDialog);
  const secretPermissions = useSecretPermissions();
  const canDelete = !ownerReference && secretPermissions.data.delete.allowed;
  const deleteDisabledTooltip = ownerReference
    ? "You cannot delete this integration because the secret has owner references."
    : secretPermissions.data.delete.reason;

  const handleDelete = React.useCallback(() => {
    if (!canDelete || !secret) return;

    openDeleteKubeObjectDialog({
      objectName: secret?.metadata.name,
      resourceConfig: k8sSecretConfig,
      resource: secret,
      description: `Confirm the deletion of the integration.`,
      createCustomMessages: (item) => ({
        loading: {
          message: `${item.metadata.name} has been marked for deletion`,
        },
        error: {
          message: `Failed to initiate ${item.metadata.name}'s deletion`,
        },
        success: {
          message: "The deletion process has been started",
        },
      }),
    });
  }, [canDelete, openDeleteKubeObjectDialog, secret]);

  if (!secret || !jiraServer) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <JiraServerForm />
        </div>
        <div>
          <SecretForm />
        </div>
        <div>
          <Actions />
        </div>
      </div>
    );
  }

  const status = jiraServer.status?.status;
  const statusIcon = getJiraServerStatusIcon(jiraServer);

  return (
    <Accordion type="single" collapsible defaultValue="item-1">
      <AccordionItem value="item-1">
        <AccordionTrigger className="cursor-default">
          <div className="flex w-full items-center justify-between">
            <h6 className="text-base font-medium">
              <div className="flex items-center gap-2">
                <div className="mr-1">
                  <StatusIcon
                    Icon={statusIcon.component}
                    color={statusIcon.color}
                    Title={
                      <>
                        <p className="text-sm font-semibold">
                          {`Status: ${status === undefined ? "Unknown" : status}`}
                        </p>
                        {!!jiraServer.status?.detailed_message && (
                          <p className="mt-3 text-sm font-medium">{jiraServer.status.detailed_message}</p>
                        )}
                      </>
                    }
                  />
                </div>
                <div>{secret.metadata.name}</div>
                {!!ownerReference && (
                  <div>
                    <Tooltip title={`Managed by ${ownerReference}`}>
                      <ShieldX size={20} />
                    </Tooltip>
                  </div>
                )}
              </div>
            </h6>
            <ConditionalWrapper
              condition={!canDelete}
              wrapper={(children) => (
                <Tooltip title={deleteDisabledTooltip}>
                  <div>{children}</div>
                </Tooltip>
              )}
            >
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                disabled={!canDelete}
                aria-label="Delete"
              >
                <Trash size={20} />
                Delete
              </Button>
            </ConditionalWrapper>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-col gap-6">
            <div>
              <JiraServerForm />
            </div>
            <div>
              <SecretForm />
            </div>
            <div>
              <Actions />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
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
