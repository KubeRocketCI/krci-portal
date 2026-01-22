import React from "react";
import { Form } from "./components/Form";
import { FormActions } from "./components/FormActions";
import { CreateProps } from "./types";
import { clusterType, ClusterType, createClusterSecretDraft } from "@my-project/shared";
import { ClusterSecretFormProvider } from "../../providers/form/provider";
import { createDefaultValues } from "../../providers/form/constants";
import { ClusterSecretDataProvider } from "../../providers/data/provider";
import { useSecretCRUD, useSecretPermissions } from "@/k8s/api/groups/Core/Secret";
import type { ManageClusterSecretValues } from "../../types";

export const Create = ({ formData }: CreateProps) => {
  const [activeClusterType, setActiveClusterType] = React.useState<ClusterType>(clusterType.bearer);
  const { handleClosePlaceholder } = formData;

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
          onSuccess: handleClosePlaceholder,
        },
      });
    },
    [activeClusterType, handleClosePlaceholder, secretPermissions.data.create.allowed, triggerCreateSecret]
  );

  return (
    <ClusterSecretDataProvider formData={formData}>
      <ClusterSecretFormProvider defaultValues={createDefaultValues} onSubmit={handleSubmit}>
        <div className="flex flex-col gap-6">
          <div>
            <Form activeClusterType={activeClusterType} setActiveClusterType={setActiveClusterType} />
          </div>
          <div>
            <FormActions />
          </div>
        </div>
      </ClusterSecretFormProvider>
    </ClusterSecretDataProvider>
  );
};
