import React from "react";
import { Form } from "./components/Form";
import { FormActions } from "./components/FormActions";
import { clusterType, ClusterType, createClusterSecretDraft } from "@my-project/shared";
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
  const [activeClusterType, setActiveClusterType] = React.useState<ClusterType>(clusterType.bearer);

  const { triggerCreateSecret } = useSecretCRUD();
  const secretPermissions = useSecretPermissions();

  const handleSubmit = React.useCallback(
    async (values: ManageClusterSecretValues) => {
      if (!secretPermissions.data.create.allowed) {
        return;
      }

      const { clusterName, clusterHost, clusterToken, clusterCertificate, skipTLSVerify, roleARN, caData } = values;

      const secretDraft = createClusterSecretDraft({
        clusterType: activeClusterType,
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
    [activeClusterType, onClose, secretPermissions.data.create.allowed, triggerCreateSecret]
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
          <Form activeClusterType={activeClusterType} setActiveClusterType={setActiveClusterType} />
          <FormActions />
        </div>
      </ClusterSecretFormProvider>
    </ClusterSecretDataProvider>
  );
};
