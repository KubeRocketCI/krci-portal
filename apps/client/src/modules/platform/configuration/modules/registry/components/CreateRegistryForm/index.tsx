import React from "react";
import { containerRegistryType, ContainerRegistryPlatform } from "@my-project/shared";
import { CreateRegistryFormValues } from "./schema";
import { NAMES } from "./constants";
import { CreateRegistryFormProps } from "./types";
import { CreateRegistryFormProvider } from "./providers/form/provider";
import { Form } from "./components/Form";
import { FormActions } from "./components/FormActions";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { toast } from "sonner";
import { satisfiesType } from "../../utils";
import { Alert } from "@/core/components/ui/alert";
import type { RequestError } from "@/core/types/global";
import { getK8sErrorMessage } from "@/k8s/api/utils/getK8sErrorMessage";

export type { CreateRegistryFormProps } from "./types";
export { FormActions as CreateRegistryFormActions } from "./components/FormActions";

// Context to share error state between provider and form
const CreateRegistryFormErrorContext = React.createContext<{
  error: RequestError | null;
  setError: (error: RequestError | null) => void;
} | null>(null);

export const useCreateRegistryFormError = () => {
  const context = React.useContext(CreateRegistryFormErrorContext);
  if (!context) {
    throw new Error("useCreateRegistryFormError must be used within CreateRegistryFormProviderWrapper");
  }
  return context;
};

export const CreateRegistryForm: React.FC<CreateRegistryFormProps> = ({
  EDPConfigMap,
}) => {
  const platform = EDPConfigMap?.data?.platform as ContainerRegistryPlatform;
  const { error } = useCreateRegistryFormError();

  return (
    <>
      {error && (
        <Alert variant="destructive" title="Failed to create container registry integration">
          {getK8sErrorMessage(error)}
        </Alert>
      )}
      <Form platform={platform} />
    </>
  );
};

// Provider wrapper component that should wrap both form and actions in the view
interface CreateRegistryFormProviderWrapperProps extends CreateRegistryFormProps {
  children: React.ReactNode;
}

export const CreateRegistryFormProviderWrapper: React.FC<CreateRegistryFormProviderWrapperProps> = ({
  EDPConfigMap,
  pushAccountSecret,
  pullAccountSecret,
  tektonServiceAccount,
  onClose,
  children,
}) => {
  const trpc = useTRPCClient();
  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );

  const [requestError, setRequestError] = React.useState<RequestError | null>(null);

  const defaultValues = React.useMemo<Partial<CreateRegistryFormValues>>(() => {
    return {
      [NAMES.REGISTRY_TYPE]: "" as CreateRegistryFormValues[typeof NAMES.REGISTRY_TYPE],
      [NAMES.REGISTRY_ENDPOINT]: "",
      [NAMES.REGISTRY_SPACE]: "",
      [NAMES.AWS_REGION]: "",
      [NAMES.IRSA_ROLE_ARN]: "",
      [NAMES.PUSH_ACCOUNT_USER]: "",
      [NAMES.PUSH_ACCOUNT_PASSWORD]: "",
      [NAMES.PULL_ACCOUNT_USER]: "",
      [NAMES.PULL_ACCOUNT_PASSWORD]: "",
      [NAMES.USE_SAME_ACCOUNT]: false,
    };
  }, []);

  const handleSubmit = React.useCallback(
    async (values: CreateRegistryFormValues) => {
      try {
        setRequestError(null);

        const registryType = values[NAMES.REGISTRY_TYPE];
        const needsPushAccount = satisfiesType(registryType, [
          containerRegistryType.harbor,
          containerRegistryType.nexus,
          containerRegistryType.openshift,
          containerRegistryType.dockerhub,
          containerRegistryType.ghcr,
        ]);
        const needsServiceAccount = satisfiesType(registryType, [containerRegistryType.ecr]);

        const result = await trpc.k8s.manageRegistryIntegration.mutate({
          clusterName,
          namespace: defaultNamespace,
          mode: "create",
          dirtyFields: {
            configMap: true,
            pullAccountSecret: true,
            pushAccountSecret: Boolean(needsPushAccount),
            serviceAccount: Boolean(needsServiceAccount),
          },
          configMap: {
            registryType: values[NAMES.REGISTRY_TYPE],
            registrySpace: values[NAMES.REGISTRY_SPACE],
            registryEndpoint: values[NAMES.REGISTRY_ENDPOINT],
            awsRegion: values[NAMES.AWS_REGION],
            currentResource: EDPConfigMap,
          },
          pullAccountSecret: {
            user: values[NAMES.PULL_ACCOUNT_USER],
            password: values[NAMES.PULL_ACCOUNT_PASSWORD],
            currentResource: pullAccountSecret,
          },
          pushAccountSecret: needsPushAccount
            ? {
                user: values[NAMES.PUSH_ACCOUNT_USER] || "",
                password: values[NAMES.PUSH_ACCOUNT_PASSWORD] || "",
                currentResource: pushAccountSecret,
              }
            : undefined,
          serviceAccount: needsServiceAccount
            ? {
                irsaRoleArn: values[NAMES.IRSA_ROLE_ARN] || "",
                currentResource: tektonServiceAccount,
              }
            : undefined,
        });

        if (!result.success) {
          throw new Error("Failed to create container registry integration");
        }

        toast.success(result.data?.message || "Container registry integration created successfully");
        onClose();
      } catch (error) {
        console.error("Failed to create container registry integration:", error);
        setRequestError(error as RequestError);
        toast.error(error instanceof Error ? error.message : "Failed to create container registry integration");
        throw error;
      }
    },
    [
      clusterName,
      defaultNamespace,
      EDPConfigMap,
      pushAccountSecret,
      pullAccountSecret,
      tektonServiceAccount,
      trpc,
      onClose,
    ]
  );

  const handleSubmitError = React.useCallback((error: unknown) => {
    console.error("Form submission error:", error);
  }, []);

  return (
    <CreateRegistryFormErrorContext.Provider value={{ error: requestError, setError: setRequestError }}>
      <CreateRegistryFormProvider defaultValues={defaultValues} onSubmit={handleSubmit} onSubmitError={handleSubmitError}>
        {children}
      </CreateRegistryFormProvider>
    </CreateRegistryFormErrorContext.Provider>
  );
};
