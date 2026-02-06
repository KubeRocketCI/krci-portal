import React from "react";
import { Actions } from "./components/Actions";
import { QuickLinkForm } from "./components/QuickLink";
import { SecretForm } from "./components/Secret";
import { DataContextProvider } from "./providers/Data";
import { ManageSonarFormProvider } from "./providers/form/provider";
import { ManageSonarCIProps } from "./types";
import { ManageSonarFormValues, NAMES } from "./names";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { safeDecode, getIntegrationSecretStatus, k8sSecretConfig } from "@my-project/shared";
import { FORM_MODES } from "@/core/types/forms";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/core/components/ui/accordion";
import { StatusIcon } from "@/core/components/StatusIcon";
import { Tooltip } from "@/core/components/ui/tooltip";
import { ShieldX, Trash } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { ConditionalWrapper } from "@/core/components/ConditionalWrapper";
import { getIntegrationSecretStatusIcon } from "@/k8s/integrations/secret/utils/getStatusIcon";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { DeleteKubeObjectDialog } from "@/core/components/DeleteKubeObject";
import { useSecretPermissions } from "@/k8s/api/groups/Core/Secret";

/**
 * Rendered inside ManageSonarFormProvider so it has access to the form via useManageSonarForm().
 * In edit mode wraps everything in an accordion (with delete in the trigger); in create mode renders the form fields directly.
 */
const FormContent = ({
  secret,
  ownerReference,
  mode,
}: Pick<ManageSonarCIProps, "secret" | "ownerReference" | "mode">) => {
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

  if (mode === FORM_MODES.CREATE || !secret) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <QuickLinkForm />
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

  const status = getIntegrationSecretStatus(secret);
  const statusIcon = getIntegrationSecretStatusIcon(secret);

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
                          {`Connected: ${status.connected === undefined ? "Unknown" : status.connected}`}
                        </p>
                        {!!status.statusError && <p className="mt-3 text-sm font-medium">{status.statusError}</p>}
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
              <QuickLinkForm />
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

export const ManageSonar = ({ quickLink, secret, mode, ownerReference, handleClosePanel }: ManageSonarCIProps) => {
  const trpc = useTRPCClient();
  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({ clusterName: state.clusterName, defaultNamespace: state.defaultNamespace }))
  );

  const defaultValues = React.useMemo<Partial<ManageSonarFormValues>>(
    () => ({
      [NAMES.EXTERNAL_URL]: quickLink?.spec?.url || "",
      [NAMES.TOKEN]: safeDecode(secret?.data?.token || "", ""),
      [NAMES.URL]: safeDecode(secret?.data?.url || "", ""),
    }),
    [quickLink, secret]
  );

  const handleSubmit = React.useCallback(
    async (values: ManageSonarFormValues) => {
      try {
        await trpc.k8s.manageSonarIntegration.mutate({
          clusterName,
          namespace: defaultNamespace,
          mode: mode === FORM_MODES.CREATE ? "create" : "edit",
          dirtyFields: {
            quickLink: mode === FORM_MODES.CREATE || values.externalUrl !== quickLink?.spec?.url,
            secret:
              mode === FORM_MODES.CREATE ||
              values.token !== safeDecode(secret?.data?.token || "", "") ||
              values.url !== safeDecode(secret?.data?.url || "", ""),
          },
          quickLink: quickLink
            ? { name: quickLink.metadata.name, externalUrl: values.externalUrl, currentResource: quickLink }
            : undefined,
          secret: { token: values.token, url: values.url, currentResource: secret },
        });
        toast.success("SonarQube integration saved successfully");
        handleClosePanel?.();
      } catch (error) {
        console.error("Failed to save SonarQube integration:", error);
        toast.error(error instanceof Error ? error.message : "Failed to save SonarQube integration");
        throw error;
      }
    },
    [clusterName, defaultNamespace, mode, quickLink, secret, trpc, handleClosePanel]
  );

  const handleSubmitError = React.useCallback((error: unknown) => {
    console.error("Form submission error:", error);
  }, []);

  return (
    <div data-testid="form">
      <DataContextProvider
        secret={secret}
        quickLink={quickLink}
        mode={mode}
        ownerReference={ownerReference}
        handleClosePanel={handleClosePanel}
      >
        <ManageSonarFormProvider
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          onSubmitError={handleSubmitError}
        >
          <FormContent secret={secret} ownerReference={ownerReference} mode={mode} />
        </ManageSonarFormProvider>
      </DataContextProvider>
    </div>
  );
};
