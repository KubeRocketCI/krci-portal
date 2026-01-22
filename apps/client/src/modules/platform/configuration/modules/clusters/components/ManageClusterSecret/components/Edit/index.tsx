import React from "react";
import { Form } from "./components/Form";
import { FormActions } from "./components/FormActions";
import { useDefaultValues } from "./hooks/useDefaultValues";
import { EditProps } from "./types";
import { ClusterSecretFormProvider } from "../../providers/form/provider";
import { ClusterSecretDataProvider } from "../../providers/data/provider";
import { useSecretCRUD } from "@/k8s/api/groups/Core/Secret";
import { editClusterSecret } from "@my-project/shared";
import type { ManageClusterSecretValues } from "../../types";

export const Edit = ({ formData }: EditProps) => {
  const baseDefaultValues = useDefaultValues({ formData });
  const { currentElement } = formData;

  const { triggerEditSecret } = useSecretCRUD();

  const handleSubmit = React.useCallback(
    async (values: ManageClusterSecretValues) => {
      if (!currentElement) {
        return;
      }

      const {
        clusterName,
        clusterType,
        clusterHost,
        clusterToken,
        clusterCertificate,
        skipTLSVerify,
        roleARN,
        caData,
      } = values;

      const newSecretDraft = editClusterSecret(currentElement, {
        clusterType,
        clusterName,
        clusterHost,
        clusterToken,
        clusterCertificate,
        skipTLSVerify,
        roleARN,
        caData,
      });

      await triggerEditSecret({
        data: {
          resource: newSecretDraft,
        },
      });
    },
    [currentElement, triggerEditSecret]
  );

  return (
    <ClusterSecretDataProvider formData={formData}>
      <ClusterSecretFormProvider defaultValues={baseDefaultValues} onSubmit={handleSubmit}>
        <div className="flex flex-col gap-6">
          <div>
            <Form />
          </div>
          <div>
            <FormActions />
          </div>
        </div>
      </ClusterSecretFormProvider>
    </ClusterSecretDataProvider>
  );
};
