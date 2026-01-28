import React from "react";
import { Actions } from "./components/Actions";
import { QuickLinkForm } from "./components/QuickLink";
import { SecretForm } from "./components/Secret";
import { DataContextProvider } from "./providers/Data";
import { ManageChatAssistantFormProvider } from "./providers/form/provider";
import { ManageChatAssistantProps } from "./types";
import { ManageChatAssistantFormValues, NAMES } from "./names";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { safeDecode } from "@my-project/shared";
import { FORM_MODES } from "@/core/types/forms";
import { toast } from "sonner";

export const ManageChatAssistant = ({
  quickLink,
  secret,
  mode,
  ownerReference,
  handleClosePanel,
}: ManageChatAssistantProps) => {
  const trpc = useTRPCClient();
  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({ clusterName: state.clusterName, defaultNamespace: state.defaultNamespace }))
  );

  const defaultValues = React.useMemo<Partial<ManageChatAssistantFormValues>>(
    () => ({
      [NAMES.EXTERNAL_URL]: quickLink?.spec?.url || "",
      [NAMES.API_URL]: safeDecode(secret?.data?.apiUrl || "", ""),
      [NAMES.TOKEN]: safeDecode(secret?.data?.token || "", ""),
      [NAMES.ASSISTANT_ID]: safeDecode(secret?.data?.assistantId || "", ""),
    }),
    [quickLink, secret]
  );

  const handleSubmit = React.useCallback(
    async (values: ManageChatAssistantFormValues) => {
      try {
        await trpc.k8s.manageChatAssistantIntegration.mutate({
          clusterName,
          namespace: defaultNamespace,
          mode: mode === FORM_MODES.CREATE ? "create" : "edit",
          dirtyFields: {
            quickLink: mode === FORM_MODES.CREATE || values.externalUrl !== quickLink?.spec?.url,
            secret:
              mode === FORM_MODES.CREATE ||
              values.apiUrl !== safeDecode(secret?.data?.apiUrl || "", "") ||
              values.token !== safeDecode(secret?.data?.token || "", "") ||
              values.assistantId !== safeDecode(secret?.data?.assistantId || "", ""),
          },
          quickLink: quickLink
            ? { name: quickLink.metadata.name, externalUrl: values.externalUrl, currentResource: quickLink }
            : undefined,
          secret: {
            apiUrl: values.apiUrl,
            token: values.token,
            assistantId: values.assistantId,
            currentResource: secret,
          },
        });
        toast.success("Chat Assistant integration saved successfully");
        handleClosePanel?.();
      } catch (error) {
        console.error("Failed to save Chat Assistant integration:", error);
        toast.error(error instanceof Error ? error.message : "Failed to save Chat Assistant integration");
      }
    },
    [clusterName, defaultNamespace, mode, quickLink, secret, trpc, handleClosePanel]
  );

  const handleSubmitError = React.useCallback((error: unknown) => {
    console.error("Form submission error:", error);
    toast.error(error instanceof Error ? error.message : "An error occurred during submission");
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
        <ManageChatAssistantFormProvider
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          onSubmitError={handleSubmitError}
        >
          <div className="flex flex-col gap-6">
            <div><QuickLinkForm /></div>
            <div><SecretForm /></div>
            <div><Actions /></div>
          </div>
        </ManageChatAssistantFormProvider>
      </DataContextProvider>
    </div>
  );
};
