import React from "react";
import { DialogBody, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import { EditNexusFormValues } from "./types";
import { NAMES } from "./constants";
import { EditNexusFormProvider } from "./providers/form/provider";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { safeDecode } from "@my-project/shared";
import { showToast } from "@/core/components/Snackbar";
import { Form } from "./components/Form";
import { FormActions } from "./components/FormActions";
import { FormGuideToggleButton, FormGuidePanel } from "@/core/components/FormGuide";
import type { Secret, QuickLink } from "@my-project/shared";
import { Alert } from "@/core/components/ui/alert";
import type { RequestError } from "@/core/types/global";
import { getK8sErrorMessage } from "@/k8s/api/utils/getK8sErrorMessage";

export type { EditNexusFormProps } from "./types";

export const EditNexusForm: React.FC<{
  secret: Secret;
  quickLink: QuickLink | undefined;
  ownerReference: string | undefined;
  onClose: () => void;
}> = ({ secret, quickLink, ownerReference, onClose }) => {
  const trpc = useTRPCClient();
  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );

  const [requestError, setRequestError] = React.useState<RequestError | null>(null);

  const defaultValues = React.useMemo<Partial<EditNexusFormValues>>(
    () => ({
      [NAMES.EXTERNAL_URL]: quickLink?.spec?.url || "",
      [NAMES.USERNAME]: safeDecode(secret?.data?.username || "", ""),
      [NAMES.PASSWORD]: safeDecode(secret?.data?.password || "", ""),
      [NAMES.URL]: safeDecode(secret?.data?.url || "", ""),
    }),
    [quickLink, secret]
  );

  const handleSubmit = React.useCallback(
    async (values: EditNexusFormValues) => {
      const loadingToastId = showToast("Saving Nexus integration", "loading");
      try {
        setRequestError(null);
        await trpc.k8s.manageNexusIntegration.mutate({
          clusterName,
          namespace: defaultNamespace,
          mode: "edit",
          dirtyFields: {
            quickLink: values.externalUrl !== quickLink?.spec?.url,
            secret:
              values.username !== safeDecode(secret?.data?.username || "", "") ||
              values.password !== safeDecode(secret?.data?.password || "", "") ||
              values.url !== safeDecode(secret?.data?.url || "", ""),
          },
          quickLink: quickLink
            ? {
                name: quickLink.metadata.name,
                externalUrl: values.externalUrl,
                currentResource: quickLink,
              }
            : undefined,
          secret: {
            username: values.username,
            password: values.password,
            url: values.url,
            currentResource: secret,
          },
        });

        showToast("Nexus integration saved successfully", "success", {
          id: loadingToastId,
          duration: 5000,
        });
        onClose();
      } catch (error) {
        console.error("Failed to save Nexus integration:", error);
        setRequestError(error as RequestError);
        showToast("Failed to save Nexus integration", "error", {
          id: loadingToastId,
          duration: 10000,
          description: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    [clusterName, defaultNamespace, quickLink, secret, trpc, onClose]
  );

  const handleSubmitError = React.useCallback((error: unknown) => {
    console.error("Form submission error:", error);
  }, []);

  return (
    <EditNexusFormProvider defaultValues={defaultValues} onSubmit={handleSubmit} onSubmitError={handleSubmitError}>
      <DialogHeader>
        <div className="flex flex-row items-start justify-between gap-2">
          <div className="flex flex-col gap-4">
            <DialogTitle className="text-xl font-medium">Edit Nexus Integration</DialogTitle>
          </div>
          <FormGuideToggleButton />
        </div>
      </DialogHeader>
      <DialogBody className="flex min-h-0">
        <div className="flex min-h-0 flex-1 gap-4">
          <div className="min-h-0 flex-1 overflow-y-auto p-0.5">
            <div className="flex flex-col gap-4">
              {requestError && (
                <Alert variant="destructive" title="Failed to update Nexus integration">
                  {getK8sErrorMessage(requestError)}
                </Alert>
              )}
              <Form quickLink={quickLink} ownerReference={ownerReference} />
            </div>
          </div>
          <FormGuidePanel />
        </div>
      </DialogBody>
      <DialogFooter>
        <FormActions onClose={onClose} />
      </DialogFooter>
    </EditNexusFormProvider>
  );
};
