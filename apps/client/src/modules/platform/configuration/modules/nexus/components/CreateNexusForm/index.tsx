import React from "react";
import { CreateNexusFormValues } from "./types";
import { NAMES } from "./constants";
import { CreateNexusFormProvider } from "./providers/form/provider";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { toast } from "sonner";
import { Form } from "./components/Form";
import { FormActions } from "./components/FormActions";
import { Alert } from "@/core/components/ui/alert";
import type { RequestError } from "@/core/types/global";
import { getK8sErrorMessage } from "@/k8s/api/utils/getK8sErrorMessage";
import type { QuickLink } from "@my-project/shared";

export type { CreateNexusFormProps } from "./types";

export const CreateNexusForm: React.FC<{ quickLink: QuickLink | undefined; onClose: () => void }> = ({
  quickLink,
  onClose,
}) => {
  const trpc = useTRPCClient();
  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );

  const [requestError, setRequestError] = React.useState<RequestError | null>(null);

  const defaultValues = React.useMemo<Partial<CreateNexusFormValues>>(
    () => ({
      [NAMES.EXTERNAL_URL]: "",
      [NAMES.USERNAME]: "",
      [NAMES.PASSWORD]: "",
      [NAMES.URL]: "",
    }),
    []
  );

  const handleSubmit = React.useCallback(
    async (values: CreateNexusFormValues) => {
      try {
        setRequestError(null);
        await trpc.k8s.manageNexusIntegration.mutate({
          clusterName,
          namespace: defaultNamespace,
          mode: "create",
          dirtyFields: {
            quickLink: true,
            secret: true,
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
            currentResource: undefined,
          },
        });

        toast.success("Nexus integration created successfully");
        onClose();
      } catch (error) {
        console.error("Failed to create Nexus integration:", error);
        setRequestError(error as RequestError);
        toast.error(error instanceof Error ? error.message : "Failed to create Nexus integration");
        throw error;
      }
    },
    [clusterName, defaultNamespace, quickLink, trpc, onClose]
  );

  const handleSubmitError = React.useCallback((error: unknown) => {
    console.error("Form submission error:", error);
  }, []);

  return (
    <CreateNexusFormProvider defaultValues={defaultValues} onSubmit={handleSubmit} onSubmitError={handleSubmitError}>
      <div className="flex flex-col gap-6">
        {requestError && (
          <Alert variant="destructive" title="Failed to create Nexus integration">
            {getK8sErrorMessage(requestError)}
          </Alert>
        )}
        <Form />
        <FormActions onClose={onClose} />
      </div>
    </CreateNexusFormProvider>
  );
};
