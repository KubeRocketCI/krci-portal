import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from "@/core/components/ui/dialog";
import { FormGuideProvider } from "@/core/providers/FormGuide/provider";
import { FormGuideDialogContent, FormGuideToggleButton, FormGuidePanel } from "@/core/components/FormGuide";
import { FORM_GUIDE_CONFIG } from "../ManageRegistry/constants";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { ManageRegistryActions } from "../ManageRegistry";
import { EditRegistryForm } from "../EditRegistryForm";
import { DataContextProvider } from "../ManageRegistry/providers/Data";
import { ManageRegistryFormProvider } from "../ManageRegistry/providers/form/provider";
import {
  ConfigMap,
  Secret,
  ServiceAccount,
  containerRegistryType,
  parseRegistrySecretUserProtectedData,
} from "@my-project/shared";
import { ManageRegistryFormValues, NAMES } from "../ManageRegistry/schema";
import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { useShallow } from "zustand/react/shallow";
import React from "react";
import { toast } from "sonner";
import { satisfiesType } from "../../utils";
import type { FormGuideStep } from "@/core/providers/FormGuide/types";

const EMPTY_STEPS: FormGuideStep[] = [];

interface EditRegistryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  EDPConfigMap: ConfigMap;
  pushAccountSecret: Secret | undefined;
  pullAccountSecret: Secret | undefined;
  tektonServiceAccount: ServiceAccount | undefined;
}

export function EditRegistryDialog({
  isOpen,
  onClose,
  EDPConfigMap,
  pushAccountSecret,
  pullAccountSecret,
  tektonServiceAccount,
}: EditRegistryDialogProps) {
  const trpc = useTRPCClient();
  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({ clusterName: state.clusterName, defaultNamespace: state.defaultNamespace }))
  );

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
          mode: "edit",
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
        onClose();
      } catch (error) {
        console.error("Failed to save container registry integration:", error);
        toast.error(error instanceof Error ? error.message : "Failed to save container registry integration");
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <FormGuideProvider
        config={FORM_GUIDE_CONFIG}
        steps={EMPTY_STEPS}
        currentStepIdx={0}
        docUrl={EDP_USER_GUIDE.REGISTRY.url}
      >
        <FormGuideDialogContent>
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
              <DialogHeader>
                <div className="flex flex-row items-start justify-between gap-2">
                  <div className="flex flex-col gap-4">
                    <DialogTitle className="text-xl font-medium">Edit Container Registry Integration</DialogTitle>
                  </div>
                  <FormGuideToggleButton />
                </div>
              </DialogHeader>
              <DialogBody className="flex min-h-0">
                <div className="flex min-h-0 flex-1 gap-4">
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <EditRegistryForm />
                  </div>
                  <FormGuidePanel />
                </div>
              </DialogBody>
              <DialogFooter>
                <ManageRegistryActions handleCloseCreateDialog={onClose} />
              </DialogFooter>
            </ManageRegistryFormProvider>
          </DataContextProvider>
        </FormGuideDialogContent>
      </FormGuideProvider>
    </Dialog>
  );
}
