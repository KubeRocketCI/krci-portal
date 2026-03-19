import React from "react";
import { containerRegistryType, ContainerRegistryPlatform, parseRegistrySecretUserProtectedData } from "@my-project/shared";
import { EditRegistryFormValues } from "./schema";
import { NAMES } from "./constants";
import { EditRegistryFormProps } from "./types";
import { EditRegistryFormProvider } from "./providers/form/provider";
import { Form } from "./components/Form";
import { FormActions } from "./components/FormActions";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { toast } from "sonner";
import { satisfiesType } from "../../utils";

export type { EditRegistryFormProps } from "./types";
export { FormActions as EditRegistryFormActions } from "./components/FormActions";

/**
 * Standalone EditRegistryForm component with its own provider, submission logic, and field components.
 * Fully independent from ManageRegistry pattern.
 */
export const EditRegistryForm: React.FC<EditRegistryFormProps> = ({
  EDPConfigMap,
  pushAccountSecret,
  pullAccountSecret,
  tektonServiceAccount,
  onClose,
}) => {
  const platform = EDPConfigMap?.data?.platform as ContainerRegistryPlatform;

  return (
    <Form
      platform={platform}
      pushAccountSecret={pushAccountSecret}
      pullAccountSecret={pullAccountSecret}
    />
  );
};

// Provider wrapper component that should wrap both form and actions in the view
interface EditRegistryFormProviderWrapperProps extends EditRegistryFormProps {
  children: React.ReactNode;
}

export const EditRegistryFormProviderWrapper: React.FC<EditRegistryFormProviderWrapperProps> = ({
  EDPConfigMap,
  pushAccountSecret,
  pullAccountSecret,
  tektonServiceAccount,
  onClose,
  children,
}) => {
  const trpc = useTRPCClient();
  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({ clusterName: state.clusterName, defaultNamespace: state.defaultNamespace }))
  );

  const defaultValues = React.useMemo<Partial<EditRegistryFormValues>>(() => {
    const registryType = EDPConfigMap?.data?.container_registry_type || "";
    const registryEndpoint = EDPConfigMap?.data?.container_registry_host || "";
    const registrySpace = EDPConfigMap?.data?.container_registry_space || "";
    const awsRegion = EDPConfigMap?.data?.aws_region || "";

    const pushAccountData = parseRegistrySecretUserProtectedData(pushAccountSecret);
    const pullAccountData = parseRegistrySecretUserProtectedData(pullAccountSecret);

    return {
      [NAMES.REGISTRY_TYPE]: registryType as EditRegistryFormValues[typeof NAMES.REGISTRY_TYPE],
      [NAMES.REGISTRY_ENDPOINT]: registryEndpoint,
      [NAMES.REGISTRY_SPACE]: registrySpace,
      [NAMES.AWS_REGION]: awsRegion,
      [NAMES.IRSA_ROLE_ARN]: tektonServiceAccount?.metadata?.annotations?.["eks.amazonaws.com/role-arn"] || "",
      [NAMES.PUSH_ACCOUNT_USER]: pushAccountData.userName || "",
      [NAMES.PUSH_ACCOUNT_PASSWORD]: pushAccountData.password || "",
      [NAMES.PULL_ACCOUNT_USER]: pullAccountData.userName || "",
      [NAMES.PULL_ACCOUNT_PASSWORD]: pullAccountData.password || "",
      [NAMES.USE_SAME_ACCOUNT]: false,
    };
  }, [EDPConfigMap, pushAccountSecret, pullAccountSecret, tektonServiceAccount]);

  const handleSubmit = React.useCallback(
    async (values: EditRegistryFormValues) => {
      try {
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
          mode: "edit",
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
          throw new Error("Failed to save container registry integration");
        }

        toast.success(result.data?.message || "Container registry integration saved successfully");
        onClose();
      } catch (error) {
        console.error("Failed to save container registry integration:", error);
        toast.error(error instanceof Error ? error.message : "Failed to save container registry integration");
        throw error;
      }
    },
    [clusterName, defaultNamespace, EDPConfigMap, pushAccountSecret, pullAccountSecret, tektonServiceAccount, trpc, onClose]
  );

  const handleSubmitError = React.useCallback((error: unknown) => {
    console.error("Form submission error:", error);
  }, []);

  return (
    <EditRegistryFormProvider defaultValues={defaultValues} onSubmit={handleSubmit} onSubmitError={handleSubmitError}>
      {children}
    </EditRegistryFormProvider>
  );
};
