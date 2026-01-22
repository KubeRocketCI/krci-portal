import { CLUSTER_FORM_NAMES } from "../../../names";
import { useClusterSecretForm } from "../../../providers/form/hooks";
import { useClusterSecretData } from "../../../providers/data/hooks";
import { FORM_MODES } from "@/core/types/forms";
import { getValidURLPattern } from "@/core/utils/getValidURLPattern";
import { VALIDATED_PROTOCOL } from "@/k8s/constants/validatedProtocols";

export const ClusterHost = () => {
  const form = useClusterSecretForm();
  const { mode, ownerReference } = useClusterSecretData();
  const urlPattern = getValidURLPattern(VALIDATED_PROTOCOL.STRICT_HTTPS);

  return (
    <form.AppField
      name={CLUSTER_FORM_NAMES.CLUSTER_HOST}
      validators={{
        onChange: ({ value }) => {
          if (!value) return "Enter the cluster URL assigned to the host.";
          if (!urlPattern.test(value)) {
            return "Enter a valid URL with HTTPS protocol.";
          }
          return undefined;
        },
      }}
    >
      {(field) => (
        <field.FormTextField
          label="Cluster Host"
          tooltipText={
            <>
              <p>
                Enter cluster's endpoint URL (e.g., <em>https://example-cluster-domain.com)</em>.
              </p>
            </>
          }
          placeholder="Enter cluster host"
          disabled={mode === FORM_MODES.EDIT && !!ownerReference}
          helperText={ownerReference ? `This field value is managed by ${ownerReference}` : undefined}
        />
      )}
    </form.AppField>
  );
};
