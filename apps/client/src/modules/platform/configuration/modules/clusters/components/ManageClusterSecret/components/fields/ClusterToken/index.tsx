import { CLUSTER_FORM_NAMES } from "../../../names";
import { useClusterSecretForm } from "../../../providers/form/hooks";
import { useClusterSecretData } from "../../../providers/data/hooks";
import { FORM_MODES } from "@/core/types/forms";

export const ClusterToken = () => {
  const form = useClusterSecretForm();
  const { mode, ownerReference } = useClusterSecretData();

  return (
    <form.AppField
      name={CLUSTER_FORM_NAMES.CLUSTER_TOKEN}
      validators={{
        onChange: ({ value }) => {
          if (!value) return "Provide the cluster token.";
          return undefined;
        },
      }}
    >
      {(field) => (
        <field.FormTextField
          label="Cluster Token"
          type="password"
          tooltipText="Provide a Kubernetes token with permissions to access the cluster. This token is required for proper authorization."
          placeholder="Enter cluster token"
          disabled={mode === FORM_MODES.EDIT && !!ownerReference}
          helperText={ownerReference ? `This field value is managed by ${ownerReference}` : undefined}
        />
      )}
    </form.AppField>
  );
};
