import React from "react";
import { DialogBody, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import { EditDependencyTrackFormValues } from "./types";
import { NAMES } from "./constants";
import { EditDependencyTrackFormProvider } from "./providers/form/provider";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { safeDecode } from "@my-project/shared";
import { toast } from "sonner";
import { Form } from "./components/Form";
import { FormActions } from "./components/FormActions";
import { FormGuideToggleButton, FormGuidePanel } from "@/core/components/FormGuide";
import type { Secret, QuickLink } from "@my-project/shared";
import { Alert } from "@/core/components/ui/alert";
import type { RequestError } from "@/core/types/global";
import { getK8sErrorMessage } from "@/k8s/api/utils/getK8sErrorMessage";

export type { EditDependencyTrackFormProps } from "./types";

export const EditDependencyTrackForm: React.FC<{
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

  const defaultValues = React.useMemo<Partial<EditDependencyTrackFormValues>>(
    () => ({
      [NAMES.EXTERNAL_URL]: quickLink?.spec?.url || "",
      [NAMES.TOKEN]: safeDecode(secret?.data?.token || "", ""),
      [NAMES.URL]: safeDecode(secret?.data?.url || "", ""),
    }),
    [quickLink, secret]
  );

  const handleSubmit = React.useCallback(
    async (values: EditDependencyTrackFormValues) => {
      try {
        setRequestError(null);
        await trpc.k8s.manageDependencyTrackIntegration.mutate({
          clusterName,
          namespace: defaultNamespace,
          mode: "edit",
          dirtyFields: {
            quickLink: values.externalUrl !== quickLink?.spec?.url,
            secret:
              values.token !== safeDecode(secret?.data?.token || "", "") ||
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
            token: values.token,
            url: values.url,
            currentResource: secret,
          },
        });

        toast.success("Dependency-Track integration saved successfully");
        onClose();
      } catch (error) {
        console.error("Failed to save Dependency-Track integration:", error);
        setRequestError(error as RequestError);
        toast.error(error instanceof Error ? error.message : "Failed to save Dependency-Track integration");
        throw error;
      }
    },
    [clusterName, defaultNamespace, quickLink, secret, trpc, onClose]
  );

  const handleSubmitError = React.useCallback((error: unknown) => {
    console.error("Form submission error:", error);
  }, []);

  return (
    <EditDependencyTrackFormProvider
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      onSubmitError={handleSubmitError}
    >
      <DialogHeader>
        <div className="flex flex-row items-start justify-between gap-2">
          <div className="flex flex-col gap-4">
            <DialogTitle className="text-xl font-medium">Edit Dependency-Track Integration</DialogTitle>
          </div>
          <FormGuideToggleButton />
        </div>
      </DialogHeader>
      <DialogBody className="flex min-h-0">
        <div className="flex min-h-0 flex-1 gap-4">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="flex flex-col gap-4">
              {requestError && (
                <Alert variant="destructive" title="Failed to update Dependency-Track integration">
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
        <FormActions />
      </DialogFooter>
    </EditDependencyTrackFormProvider>
  );
};
