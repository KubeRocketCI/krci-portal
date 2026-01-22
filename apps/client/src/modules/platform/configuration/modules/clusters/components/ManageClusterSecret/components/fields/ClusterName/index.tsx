import { CLUSTER_FORM_NAMES } from "../../../names";
import { useClusterSecretForm } from "../../../providers/form/hooks";
import { useClusterSecretData } from "../../../providers/data/hooks";
import { FORM_MODES } from "@/core/types/forms";

export const ClusterName = () => {
  const form = useClusterSecretForm();
  const { mode, ownerReference } = useClusterSecretData();

  return (
    <form.AppField
      name={CLUSTER_FORM_NAMES.CLUSTER_NAME}
      validators={{
        onChange: ({ value }) => {
          if (!value) return "Enter a name for the cluster.";
          return undefined;
        },
      }}
    >
      {(field) => (
        <field.FormTextField
          label="Cluster Name"
          tooltipText="Provide a unique and descriptive name for the new cluster."
          placeholder="Enter cluster name"
          disabled={mode === FORM_MODES.EDIT || !!ownerReference}
          helperText={ownerReference ? `This field value is managed by ${ownerReference}` : undefined}
        />
      )}
    </form.AppField>
  );
};
