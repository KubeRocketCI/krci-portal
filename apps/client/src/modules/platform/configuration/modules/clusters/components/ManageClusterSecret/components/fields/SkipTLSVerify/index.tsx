import { useStore } from "@tanstack/react-form";
import { CLUSTER_FORM_NAMES } from "../../../names";
import { useClusterSecretForm } from "../../../providers/form/hooks";
import { useClusterSecretData } from "../../../providers/data/hooks";
import { FORM_MODES } from "@/core/types/forms";

export const SkipTLSVerify = () => {
  const form = useClusterSecretForm();
  const { mode, ownerReference } = useClusterSecretData();
  const skipTLSVerify = useStore(form.store, (state) => state.values[CLUSTER_FORM_NAMES.SKIP_TLS_VERIFY]);

  return (
    <form.AppField name={CLUSTER_FORM_NAMES.SKIP_TLS_VERIFY}>
      {(field) => (
        <field.FormSwitch
          label="Skip TLS verification"
          rich
          variant="card"
          disabled={mode === FORM_MODES.EDIT && !!ownerReference}
          expandableContent={
            !skipTLSVerify ? (
              <form.AppField
                name={CLUSTER_FORM_NAMES.CLUSTER_CERTIFICATE}
                validators={{
                  onChange: ({ value }) => {
                    if (!value) return "Paste the cluster certificate.";
                    return undefined;
                  },
                }}
              >
                {(certField) => (
                  <certField.FormTextField
                    label="Cluster Certificate"
                    tooltipText="Provide a Kubernetes certificate required for proper authentication. Take this certificate from the config file of the user you are going to access the cluster."
                    placeholder="Enter cluster certificate"
                    disabled={mode === FORM_MODES.EDIT && !!ownerReference}
                    helperText={ownerReference ? `This field value is managed by ${ownerReference}` : undefined}
                  />
                )}
              </form.AppField>
            ) : null
          }
        />
      )}
    </form.AppField>
  );
};
