import React from "react";
import { CreateJiraFormValues } from "./types";
import { NAMES } from "./constants";
import { CreateJiraFormProvider } from "./providers/form/provider";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { showToast } from "@/core/components/Snackbar";
import { Form } from "./components/Form";
import { FormActions } from "./components/FormActions";
import { Alert } from "@/core/components/ui/alert";
import type { RequestError } from "@/core/types/global";
import { getK8sErrorMessage } from "@/k8s/api/utils/getK8sErrorMessage";
import type { CreateJiraFormProps } from "./types";

export type { CreateJiraFormProps } from "./types";

export const CreateJiraForm: React.FC<CreateJiraFormProps> = ({ jiraServer, onClose }) => {
  const trpc = useTRPCClient();
  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );

  const [requestError, setRequestError] = React.useState<RequestError | null>(null);

  const defaultValues = React.useMemo<Partial<CreateJiraFormValues>>(
    () => ({
      [NAMES.URL]: "",
      [NAMES.USERNAME]: "",
      [NAMES.PASSWORD]: "",
    }),
    []
  );

  const handleSubmit = React.useCallback(
    async (values: CreateJiraFormValues) => {
      const loadingToastId = showToast("Creating Jira integration", "loading");
      try {
        setRequestError(null);
        const result = await trpc.k8s.manageJiraIntegration.mutate({
          clusterName,
          namespace: defaultNamespace,
          mode: "create",
          dirtyFields: {
            jiraServer: true,
            secret: true,
            quickLink: false,
          },
          jiraServer: {
            url: values.url,
            currentResource: jiraServer,
          },
          secret: {
            username: values.username,
            password: values.password,
            currentResource: undefined,
          },
        });

        if (!result.success) {
          throw new Error("Failed to create Jira integration");
        }

        showToast(result.data?.message || "Jira integration created successfully", "success", {
          id: loadingToastId,
          duration: 5000,
        });
        onClose();
      } catch (error) {
        console.error("Failed to create Jira integration:", error);
        setRequestError(error as RequestError);
        showToast("Failed to create Jira integration", "error", {
          id: loadingToastId,
          duration: 10000,
          description: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    [clusterName, defaultNamespace, jiraServer, trpc, onClose]
  );

  const handleSubmitError = React.useCallback((error: unknown) => {
    console.error("Form submission error:", error);
  }, []);

  return (
    <CreateJiraFormProvider defaultValues={defaultValues} onSubmit={handleSubmit} onSubmitError={handleSubmitError}>
      <div className="flex flex-col gap-4">
        {requestError && (
          <Alert variant="destructive" title="Failed to create Jira integration">
            {getK8sErrorMessage(requestError)}
          </Alert>
        )}
        <Form />
        <FormActions onClose={onClose} />
      </div>
    </CreateJiraFormProvider>
  );
};
