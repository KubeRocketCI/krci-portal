import React from "react";
import { DialogBody, DialogFooter, DialogHeader, DialogTitle } from "@/core/components/ui/dialog";
import { FormGuideToggleButton, FormGuidePanel } from "@/core/components/FormGuide";
import { Form } from "./components/Form";
import { FormActions } from "./components/FormActions";
import { createClusterSecretDraft, Secret } from "@my-project/shared";
import { ClusterSecretFormProvider } from "./providers/form/provider";
import { ClusterSecretDataProvider } from "./providers/data/provider";
import { useSecretCRUD } from "@/k8s/api/groups/Core/Secret";
import type { ManageClusterSecretValues } from "./types";
import { CLUSTER_FORM_NAMES } from "./constants";
import { Separator } from "@/core/components/ui/separator";
import { FORM_MODES } from "@/core/types/forms";
import { useDefaultValues } from "./hooks/useDefaultValues";

export interface EditClusterSecretFormProps {
  secret: Secret;
  ownerReference: string | undefined;
  onClose: () => void;
}

export const EditClusterSecretForm: React.FC<EditClusterSecretFormProps> = ({ secret, ownerReference, onClose }) => {
  const { triggerEditSecret } = useSecretCRUD();

  const handleSubmit = React.useCallback(
    async (values: ManageClusterSecretValues) => {
      const clusterTypeValue = values[CLUSTER_FORM_NAMES.CLUSTER_TYPE];
      const { clusterName, clusterHost, clusterToken, clusterCertificate, skipTLSVerify, roleARN, caData } = values;

      const secretDraft = createClusterSecretDraft({
        clusterType: clusterTypeValue,
        clusterName,
        clusterHost,
        clusterToken,
        clusterCertificate,
        skipTLSVerify,
        roleARN,
        caData,
      });

      const resource = {
        ...secretDraft,
        metadata: { ...secretDraft.metadata, name: secret.metadata.name },
      };

      await triggerEditSecret({
        data: { resource },
        callbacks: {
          onSuccess: onClose,
        },
      });
    },
    [secret.metadata.name, onClose, triggerEditSecret]
  );

  const formData = React.useMemo(
    () => ({
      handleClosePlaceholder: onClose,
      mode: FORM_MODES.EDIT,
      currentElement: secret,
      ownerReference,
    }),
    [onClose, secret, ownerReference]
  );

  const defaultValues = useDefaultValues({ formData });

  return (
    <ClusterSecretDataProvider formData={formData}>
      <ClusterSecretFormProvider defaultValues={defaultValues} onSubmit={handleSubmit}>
        <DialogHeader>
          <div className="flex flex-row items-start justify-between gap-2">
            <div className="flex flex-col gap-4">
              <DialogTitle className="text-xl font-medium">Edit Cluster: {secret.metadata.name}</DialogTitle>
            </div>
            <FormGuideToggleButton />
          </div>
        </DialogHeader>
        <DialogBody className="flex min-h-0">
          <div className="flex min-h-0 flex-1 gap-4">
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="flex flex-col gap-4">
                <Form />
                <Separator />
              </div>
            </div>
            <FormGuidePanel />
          </div>
        </DialogBody>
        <DialogFooter>
          <FormActions />
        </DialogFooter>
      </ClusterSecretFormProvider>
    </ClusterSecretDataProvider>
  );
};
