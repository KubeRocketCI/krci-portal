import React from "react";
import { useStore } from "@tanstack/react-form";
import { Actions } from "./components/Actions";
import { ConfigMapForm } from "./components/ConfigMap";
import { UseSameAccount } from "./components/fields";
import { PullAccountForm } from "./components/PullAccount";
import { PushAccountForm } from "./components/PushAccount";
import { ServiceAccountForm } from "./components/ServiceAccount";
import { ManageRegistryFormValues, NAMES } from "./schema";
import { DataContextProvider } from "./providers/Data";
import { ManageRegistryProps } from "./types";
import { containerRegistryType, parseRegistrySecretUserProtectedData } from "@my-project/shared";
import { ManageRegistryFormProvider } from "./providers/form/provider";
import { useManageRegistryForm } from "./providers/form/hooks";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { FORM_MODES } from "@/core/types/forms";
import { toast } from "sonner";

const satisfiesType = (registryType: string, allowedTypes: string[]) => {
  return registryType && allowedTypes.includes(registryType);
};

export const ManageRegistry = ({
  EDPConfigMap,
  pushAccountSecret,
  pullAccountSecret,
  tektonServiceAccount,
  handleCloseCreateDialog,
}: ManageRegistryProps) => {
  const trpc = useTRPCClient();
  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );

  // Determine mode based on presence of registryType in ConfigMap
  const mode = EDPConfigMap?.data?.container_registry_type ? FORM_MODES.EDIT : FORM_MODES.CREATE;

  // Prepare default values from existing resources
  const defaultValues = React.useMemo<Partial<ManageRegistryFormValues>>(() => {
    const registryType = EDPConfigMap?.data?.container_registry_type || "";
    const registryEndpoint = EDPConfigMap?.data?.container_registry_host || "";
    const registrySpace = EDPConfigMap?.data?.container_registry_space || "";
    const awsRegion = EDPConfigMap?.data?.aws_region || "";

    // Parse secrets from dockerconfigjson format
    const pushAccountData = parseRegistrySecretUserProtectedData(pushAccountSecret);
    const pullAccountData = parseRegistrySecretUserProtectedData(pullAccountSecret);

    return {
      [NAMES.REGISTRY_TYPE]: registryType as ManageRegistryFormValues[typeof NAMES.REGISTRY_TYPE],
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
    async (values: ManageRegistryFormValues) => {
      try {
        // Check which resources need to be updated
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
          mode: mode === FORM_MODES.CREATE ? "create" : "edit",
          dirtyFields: {
            configMap: true, // Always update ConfigMap in edit mode
            pullAccountSecret: true, // Always required
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
        handleCloseCreateDialog?.();
      } catch (error) {
        console.error("Failed to save container registry integration:", error);
        toast.error(error instanceof Error ? error.message : "Failed to save container registry integration");
        throw error;
      }
    },
    [
      clusterName,
      defaultNamespace,
      mode,
      EDPConfigMap,
      pushAccountSecret,
      pullAccountSecret,
      tektonServiceAccount,
      trpc,
      handleCloseCreateDialog,
    ]
  );

  const handleSubmitError = React.useCallback((error: unknown) => {
    console.error("Form submission error:", error);
  }, []);

  return (
    <div data-testid="form">
      <DataContextProvider
        EDPConfigMap={EDPConfigMap}
        pushAccountSecret={pushAccountSecret}
        pullAccountSecret={pullAccountSecret}
        tektonServiceAccount={tektonServiceAccount}
      >
        <ManageRegistryFormProvider
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          onSubmitError={handleSubmitError}
        >
          <ManageRegistryFormContent handleCloseCreateDialog={handleCloseCreateDialog} />
        </ManageRegistryFormProvider>
      </DataContextProvider>
    </div>
  );
};

// Separate component to use the form hook
const ManageRegistryFormContent = ({ handleCloseCreateDialog }: { handleCloseCreateDialog?: () => void }) => {
  const form = useManageRegistryForm();
  const registryType = useStore(form.store, (state) => state.values[NAMES.REGISTRY_TYPE]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <ConfigMapForm />
      </div>
      {satisfiesType(registryType, [containerRegistryType.ecr]) && (
        <div>
          <ServiceAccountForm />
        </div>
      )}
      {satisfiesType(registryType, [
        containerRegistryType.harbor,
        containerRegistryType.nexus,
        containerRegistryType.openshift,
        containerRegistryType.dockerhub,
        containerRegistryType.ghcr,
      ]) && (
        <div>
          <PushAccountForm />
        </div>
      )}
      {satisfiesType(registryType, [
        containerRegistryType.harbor,
        containerRegistryType.nexus,
        containerRegistryType.dockerhub,
        containerRegistryType.ghcr,
      ]) && (
        <div>
          <UseSameAccount />
        </div>
      )}
      {satisfiesType(registryType, [
        containerRegistryType.harbor,
        containerRegistryType.nexus,
        containerRegistryType.dockerhub,
        containerRegistryType.ghcr,
      ]) && (
        <div>
          <PullAccountForm />
        </div>
      )}
      <div>
        <Actions handleCloseCreateDialog={handleCloseCreateDialog} />
      </div>
    </div>
  );
};
