import React from "react";
import { Alert } from "@/core/components/ui/alert";
import type { RequestError } from "@/core/types/global";
import { getK8sErrorMessage } from "@/k8s/api/utils/getK8sErrorMessage";
import { ConfigMap, Secret, ServiceAccount, containerRegistryType } from "@my-project/shared";
import { ManageRegistryFormValues, NAMES } from "../ManageRegistry/schema";
import { ManageRegistryFormProvider } from "../ManageRegistry/providers/form/provider";
import { useManageRegistryForm } from "../ManageRegistry/providers/form/hooks";
import { ConfigMapForm } from "../ManageRegistry/components/ConfigMap";
import { UseSameAccount } from "../ManageRegistry/components/fields";
import { PullAccountForm } from "../ManageRegistry/components/PullAccount";
import { PushAccountForm } from "../ManageRegistry/components/PushAccount";
import { ServiceAccountForm } from "../ManageRegistry/components/ServiceAccount";
import { Separator } from "@/core/components/ui/separator";
import { Button } from "@/core/components/ui/button";
import { useStore } from "@tanstack/react-form";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import { toast } from "sonner";
import { satisfiesType } from "../../utils";

interface CreateRegistryFormProps {
  EDPConfigMap: ConfigMap | undefined;
  pullAccountSecret: Secret | undefined;
  pushAccountSecret: Secret | undefined;
  tektonServiceAccount: ServiceAccount | undefined;
  onClose: () => void;
}

export const CreateRegistryForm: React.FC<CreateRegistryFormProps> = ({
  EDPConfigMap,
  pushAccountSecret,
  pullAccountSecret,
  tektonServiceAccount,
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

  // Empty default values for create mode
  const defaultValues = React.useMemo<Partial<ManageRegistryFormValues>>(() => {
    return {
      [NAMES.REGISTRY_TYPE]: "" as ManageRegistryFormValues[typeof NAMES.REGISTRY_TYPE],
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
    async (values: ManageRegistryFormValues) => {
      try {
        setRequestError(null);

        // Check which resources need to be created
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
    <ManageRegistryFormProvider defaultValues={defaultValues} onSubmit={handleSubmit} onSubmitError={handleSubmitError}>
      <div className="flex flex-col gap-4">
        {requestError && (
          <Alert variant="destructive" title="Failed to create container registry integration">
            {getK8sErrorMessage(requestError)}
          </Alert>
        )}
        <CreateRegistryFormContent />
        <FormActions onClose={onClose} />
      </div>
    </ManageRegistryFormProvider>
  );
};

// Form content with conditional rendering based on registry type
const CreateRegistryFormContent = () => {
  const form = useManageRegistryForm();
  const registryType = useStore(form.store, (state) => state.values[NAMES.REGISTRY_TYPE]);

  return (
    <>
      <ConfigMapForm />
      {satisfiesType(registryType, [containerRegistryType.ecr]) && (
        <>
          <Separator />
          <ServiceAccountForm />
        </>
      )}
      {satisfiesType(registryType, [
        containerRegistryType.harbor,
        containerRegistryType.nexus,
        containerRegistryType.openshift,
        containerRegistryType.dockerhub,
        containerRegistryType.ghcr,
      ]) && (
        <>
          <Separator />
          <PushAccountForm />
        </>
      )}
      {satisfiesType(registryType, [
        containerRegistryType.harbor,
        containerRegistryType.nexus,
        containerRegistryType.dockerhub,
        containerRegistryType.ghcr,
      ]) && (
        <>
          <Separator />
          <UseSameAccount />
        </>
      )}
      {satisfiesType(registryType, [
        containerRegistryType.harbor,
        containerRegistryType.nexus,
        containerRegistryType.dockerhub,
        containerRegistryType.ghcr,
      ]) && (
        <>
          <Separator />
          <PullAccountForm />
        </>
      )}
    </>
  );
};

// Form actions for create mode
const FormActions = ({ onClose }: { onClose: () => void }) => {
  const form = useManageRegistryForm();
  const isDirty = useStore(form.store, (state) => state.isDirty);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

  return (
    <>
      <Button onClick={onClose} variant="ghost" size="sm">
        Cancel
      </Button>
      <Button onClick={() => form.reset()} size="sm" variant="ghost" disabled={!isDirty}>
        Undo Changes
      </Button>
      <Button onClick={() => form.handleSubmit()} size="sm" variant="default" disabled={!isDirty || isSubmitting}>
        Save
      </Button>
    </>
  );
};
