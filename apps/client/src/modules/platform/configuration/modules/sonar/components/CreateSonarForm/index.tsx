import React from "react";
import { CreateSonarFormValues } from "./types";
import { NAMES } from "./constants";
import { CreateSonarFormProvider } from "./providers/form/provider";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { toast } from "sonner";
import { Form } from "./components/Form";
import { FormActions } from "./components/FormActions";
import { Alert } from "@/core/components/ui/alert";
import type { RequestError } from "@/core/types/global";
import { getK8sErrorMessage } from "@/k8s/api/utils/getK8sErrorMessage";
import type { CreateSonarFormProps } from "./types";

export type { CreateSonarFormProps } from "./types";

export const CreateSonarForm: React.FC<CreateSonarFormProps> = ({ quickLink, onClose }) => {
  const trpc = useTRPCClient();
  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );

  const [requestError, setRequestError] = React.useState<RequestError | null>(null);

  const defaultValues = React.useMemo<Partial<CreateSonarFormValues>>(
    () => ({
      [NAMES.EXTERNAL_URL]: "",
      [NAMES.TOKEN]: "",
      [NAMES.URL]: "",
    }),
    []
  );

  const handleSubmit = React.useCallback(
    async (values: CreateSonarFormValues) => {
      try {
        setRequestError(null);
        const result = await trpc.k8s.manageSonarIntegration.mutate({
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

        if (!result.success) {
          throw new Error("Failed to create SonarQube integration");
        }

        toast.success(result.data?.message || "SonarQube integration created successfully");
        onClose();
      } catch (error) {
        console.error("Failed to create SonarQube integration:", error);
        setRequestError(error as RequestError);
        toast.error(error instanceof Error ? error.message : "Failed to create SonarQube integration");
        throw error;
      }
    },
    [clusterName, defaultNamespace, quickLink, trpc, onClose]
  );

  const handleSubmitError = React.useCallback((error: unknown) => {
    console.error("Form submission error:", error);
  }, []);

  return (
    <CreateSonarFormProvider defaultValues={defaultValues} onSubmit={handleSubmit} onSubmitError={handleSubmitError}>
      <div className="flex flex-col gap-4">
        {requestError && (
          <Alert variant="destructive" title="Failed to create SonarQube integration">
            {getK8sErrorMessage(requestError)}
          </Alert>
        )}
        <Form />
        <FormActions onClose={onClose} />
      </div>
    </CreateSonarFormProvider>
  );
};
