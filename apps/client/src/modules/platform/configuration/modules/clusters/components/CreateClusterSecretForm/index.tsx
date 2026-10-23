import React from "react";
import { Form } from "./components/Form";
import { FormActions } from "./components/FormActions";
import { createClusterSecretDraft } from "@my-project/shared";
import { ClusterSecretFormProvider } from "./providers/form/provider";
import { createDefaultValues } from "./providers/form/constants";
import { ClusterSecretDataProvider } from "./providers/data/provider";
import { useSecretCRUD, useSecretPermissions } from "@/k8s/api/groups/Core/Secret";
import type { ManageClusterSecretValues } from "./types";
import { FORM_MODES } from "@/core/types/forms";

export interface CreateClusterSecretFormProps {
  onClose: () => void;
}

export const CreateClusterSecretForm: React.FC<CreateClusterSecretFormProps> = ({ onClose }) => {
  const { triggerCreateSecret } = useSecretCRUD();
  const secretPermissions = useSecretPermissions();

  const handleSubmit = React.useCallback(
    async (values: ManageClusterSecretValues) => {
      if (!secretPermissions.data.create.allowed) {
        return;
      }

      const {
        clusterType,
        clusterName,
        clusterHost,
        clusterToken,
        clusterCertificate,
        skipTLSVerify,
        roleARN,
        caData,
      } = values;

      const secretDraft = createClusterSecretDraft({
        clusterType,
        clusterName,
        clusterHost,
        clusterToken,
        clusterCertificate,
        skipTLSVerify,
        roleARN,
        caData,
      });

      await triggerCreateSecret({
        data: {
          resource: secretDraft,
        },
        callbacks: {
          onSuccess: onClose,
        },
      });
    },
    [onClose, secretPermissions.data.create.allowed, triggerCreateSecret]
  );

  const formData = React.useMemo(
    () => ({
      handleClosePlaceholder: onClose,
      mode: FORM_MODES.CREATE,
      currentElement: undefined,
      ownerReference: undefined,
    }),
    [onClose]
  );

  return (
    <ClusterSecretDataProvider formData={formData}>
      <ClusterSecretFormProvider defaultValues={createDefaultValues} onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4">
          <Form />
          <FormActions />
        </div>
      </ClusterSecretFormProvider>
    </ClusterSecretDataProvider>
  );
};
