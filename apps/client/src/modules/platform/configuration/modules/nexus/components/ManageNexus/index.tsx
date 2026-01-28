import React from "react";
import { Actions } from "./components/Actions";
import { QuickLinkForm } from "./components/QuickLink";
import { SecretForm } from "./components/Secret";
import { DataContextProvider } from "./providers/Data";
import { ManageNexusFormProvider } from "./providers/form/provider";
import { ManageNexusCIProps } from "./types";
import { ManageNexusFormValues, NAMES } from "./names";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { safeDecode } from "@my-project/shared";
import { FORM_MODES } from "@/core/types/forms";
import { toast } from "sonner";

export const ManageNexus = ({ quickLink, secret, mode, ownerReference, handleClosePanel }: ManageNexusCIProps) => {
  const trpc = useTRPCClient();
  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({ clusterName: state.clusterName, defaultNamespace: state.defaultNamespace }))
  );

  const defaultValues = React.useMemo<Partial<ManageNexusFormValues>>(
    () => ({
      [NAMES.EXTERNAL_URL]: quickLink?.spec?.url || "",
      [NAMES.USERNAME]: safeDecode(secret?.data?.username || "", ""),
      [NAMES.PASSWORD]: safeDecode(secret?.data?.password || "", ""),
      [NAMES.URL]: safeDecode(secret?.data?.url || "", ""),
    }),
    [quickLink, secret]
  );

  const handleSubmit = React.useCallback(
    async (values: ManageNexusFormValues) => {
      try {
        await trpc.k8s.manageNexusIntegration.mutate({
          clusterName,
          namespace: defaultNamespace,
          mode: mode === FORM_MODES.CREATE ? "create" : "edit",
          dirtyFields: {
            quickLink: mode === FORM_MODES.CREATE || values.externalUrl !== quickLink?.spec?.url,
            secret:
              mode === FORM_MODES.CREATE ||
              values.username !== safeDecode(secret?.data?.username || "", "") ||
              values.password !== safeDecode(secret?.data?.password || "", "") ||
              values.url !== safeDecode(secret?.data?.url || "", ""),
          },
          quickLink: quickLink
            ? { name: quickLink.metadata.name, externalUrl: values.externalUrl, currentResource: quickLink }
            : undefined,
          secret: {
            username: values.username,
            password: values.password,
            url: values.url,
            currentResource: secret,
          },
        });
        toast.success("Nexus integration saved successfully");
        handleClosePanel?.();
      } catch (error) {
        console.error("Failed to save Nexus integration:", error);
        toast.error(error instanceof Error ? error.message : "Failed to save Nexus integration");
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
        <ManageNexusFormProvider
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          onSubmitError={handleSubmitError}
        >
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
        </ManageNexusFormProvider>
      </DataContextProvider>
    </div>
  );
};
