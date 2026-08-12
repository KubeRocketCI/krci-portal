import { CLUSTER_FORM_NAMES } from "../../../constants";
import { useClusterSecretForm } from "../../../providers/form/hooks";
import { useClusterSecretData } from "../../../providers/data/hooks";
import { FORM_MODES } from "@/core/types/forms";
import { ManagedByHelper } from "@/core/components/ManagedByHelper";

export const SkipTLSVerify = () => {
  const form = useClusterSecretForm();
  const { mode, ownerReference } = useClusterSecretData();

  const isManaged = mode === FORM_MODES.EDIT && !!ownerReference;

  // Validated on mount as well: an untouched field never fires onChange, and a cluster saved without
  // a certificate gets a kubeconfig with no CA and no skip flag, failing with "unknown authority".
  const validateCertificate = ({ value }: { value: string }) => {
    if (isManaged) return undefined;
    if (!value) return "Paste the cluster certificate.";
    return undefined;
  };

  return (
    <form.AppField
      name={CLUSTER_FORM_NAMES.SKIP_TLS_VERIFY}
      listeners={{
        onChange: ({ value }) => {
          if (!value) return;

          // The certificate field unmounts here, but its meta survives in the form store, so a stale
          // "required" error would keep blocking submit.
          form.setFieldMeta(CLUSTER_FORM_NAMES.CLUSTER_CERTIFICATE, (prev) => ({
            ...prev,
            isTouched: false,
            errorMap: {},
            errorSourceMap: {},
          }));
        },
      }}
    >
      {(field) => (
        <field.FormSwitch
          label="Skip TLS verification"
          description="Not recommended for production environments"
          rich
          variant="card"
          disabled={isManaged}
          expandWhen="unchecked"
          expandableContent={
            <form.AppField
              name={CLUSTER_FORM_NAMES.CLUSTER_CERTIFICATE}
              validators={{
                onMount: validateCertificate,
                onChange: validateCertificate,
              }}
            >
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
