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
import { safeDecode, getIntegrationSecretStatus } from "@my-project/shared";
import { FORM_MODES } from "@/core/types/forms";
import { toast } from "sonner";
import { getIntegrationSecretStatusIcon } from "@/k8s/integrations/secret/utils/getStatusIcon";
import { IntegrationFormContent } from "../../../../components/IntegrationFormContent";

/**
 * Rendered inside ManageSonarFormProvider so it has access to the form via useManageSonarForm().
 * In edit mode wraps everything in an accordion (with delete in the trigger); in create mode renders the form fields directly.
 */
const FormContent = ({
  secret,
  ownerReference,
  mode,
}: Pick<ManageSonarCIProps, "secret" | "ownerReference" | "mode">) => {
  const formFields = (
    <div className="flex flex-col gap-6">
      <QuickLinkForm />
      <SecretForm />
      <Actions />
    </div>
  );

  if (mode === FORM_MODES.CREATE || !secret) {
    return formFields;
  }

  const status = getIntegrationSecretStatus(secret);
  const statusIcon = getIntegrationSecretStatusIcon(secret);

  return (
    <IntegrationFormContent
      serviceLabel="SonarQube"
      secret={secret}
      ownerReference={ownerReference}
      statusIcon={statusIcon}
      statusTooltip={
        <>
          <p className="text-sm font-semibold">
            {`Connected: ${status.connected === undefined ? "Unknown" : status.connected}`}
          </p>
          {!!status.statusError && <p className="mt-3 text-sm font-medium">{status.statusError}</p>}
        </>
      }
    >
      {formFields}
    </IntegrationFormContent>
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
