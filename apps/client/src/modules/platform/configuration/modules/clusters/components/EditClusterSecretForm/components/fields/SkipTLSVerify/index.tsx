import { CLUSTER_FORM_NAMES } from "../../../constants";
import { useClusterSecretForm } from "../../../providers/form/hooks";
import { useClusterSecretData } from "../../../providers/data/hooks";
import { FORM_MODES } from "@/core/types/forms";
import { ManagedByHelper } from "@/core/components/ManagedByHelper";

export const SkipTLSVerify = () => {
  const form = useClusterSecretForm();
  const { mode, ownerReference } = useClusterSecretData();

  const isManaged = mode === FORM_MODES.EDIT && !!ownerReference;

  return (
    <form.AppField name={CLUSTER_FORM_NAMES.SKIP_TLS_VERIFY}>
      {(field) => (
        <field.FormSwitch
          label="Skip TLS verification"
          description="Not recommended for production environments"
          rich
          variant="card"
          disabled={isManaged}
          expandWhen="unchecked"
          expandableContent={
            <form.AppField name={CLUSTER_FORM_NAMES.CLUSTER_CERTIFICATE}>
              {(certField) => (
                <certField.FormTextField
                  label="Cluster Certificate"
                  tooltipText="Provide a Kubernetes certificate required for proper authentication. Take this certificate from the config file of the user you are going to access the cluster."
                  placeholder="Enter cluster certificate"
                  disabled={isManaged}
                  helperText={ownerReference ? <ManagedByHelper ownerReference={ownerReference} /> : undefined}
                />
              )}
            </form.AppField>
          }
        />
      )}
    </form.AppField>
  );
};
