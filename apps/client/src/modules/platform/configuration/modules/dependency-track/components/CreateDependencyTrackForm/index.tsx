import React from "react";
import { CreateDependencyTrackFormValues } from "./types";
import { NAMES } from "./constants";
import { CreateDependencyTrackFormProvider } from "./providers/form/provider";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { showToast } from "@/core/components/Snackbar";
import { Form } from "./components/Form";
import { FormActions } from "./components/FormActions";
import { Alert } from "@/core/components/ui/alert";
import type { RequestError } from "@/core/types/global";
import { getK8sErrorMessage } from "@/k8s/api/utils/getK8sErrorMessage";
import type { CreateDependencyTrackFormProps } from "./types";

export type { CreateDependencyTrackFormProps } from "./types";

export const CreateDependencyTrackForm: React.FC<CreateDependencyTrackFormProps> = ({ quickLink, onClose }) => {
  const trpc = useTRPCClient();
  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );

  const [requestError, setRequestError] = React.useState<RequestError | null>(null);

  const defaultValues = React.useMemo<Partial<CreateDependencyTrackFormValues>>(
    () => ({
      [NAMES.EXTERNAL_URL]: "",
      [NAMES.TOKEN]: "",
      [NAMES.URL]: "",
    }),
    []
  );

  const handleSubmit = React.useCallback(
    async (values: CreateDependencyTrackFormValues) => {
      const loadingToastId = showToast("Creating Dependency-Track integration", "loading");
      try {
        setRequestError(null);
        await trpc.k8s.manageDependencyTrackIntegration.mutate({
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
            token: values.token,
            url: values.url,
            currentResource: undefined,
          },
        });

        showToast("Dependency-Track integration created successfully", "success", {
          id: loadingToastId,
          duration: 5000,
        });
        onClose();
      } catch (error) {
        console.error("Failed to create Dependency-Track integration:", error);
        setRequestError(error as RequestError);
        showToast("Failed to create Dependency-Track integration", "error", {
          id: loadingToastId,
          duration: 10000,
          description: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    [clusterName, defaultNamespace, quickLink, trpc, onClose]
  );

  const handleSubmitError = React.useCallback((error: unknown) => {
    console.error("Form submission error:", error);
  }, []);

  return (
    <CreateDependencyTrackFormProvider
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      onSubmitError={handleSubmitError}
    >
      <div className="flex flex-col gap-4">
        {requestError && (
          <Alert variant="destructive" title="Failed to create Dependency-Track integration">
            {getK8sErrorMessage(requestError)}
          </Alert>
        )}
        <Form />
        <FormActions onClose={onClose} />
      </div>
    </CreateDependencyTrackFormProvider>
  );
};
