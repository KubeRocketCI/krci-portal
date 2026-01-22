import { CLUSTER_FORM_NAMES } from "../../../names";
import { useClusterSecretForm } from "../../../providers/form/hooks";
import { useClusterSecretData } from "../../../providers/data/hooks";
import { FORM_MODES } from "@/core/types/forms";

export const ClusterCertificate = () => {
  const form = useClusterSecretForm();
  const { mode, ownerReference } = useClusterSecretData();

  return (
    <form.AppField
      name={CLUSTER_FORM_NAMES.CLUSTER_CERTIFICATE}
      validators={{
        onChange: ({ value }) => {
          if (!value) return "Paste the cluster certificate.";
          return undefined;
        },
      }}
    >
      {(field) => (
        <field.FormTextField
          label="Cluster Certificate"
          tooltipText="Provide a Kubernetes certificate required for proper authentication. Take this certificate from the config file of the user you are going to access the cluster."
          placeholder="Enter cluster certificate"
          disabled={mode === FORM_MODES.EDIT && !!ownerReference}
          helperText={ownerReference ? `This field value is managed by ${ownerReference}` : undefined}
        />
      )}
    </form.AppField>
  );
};
