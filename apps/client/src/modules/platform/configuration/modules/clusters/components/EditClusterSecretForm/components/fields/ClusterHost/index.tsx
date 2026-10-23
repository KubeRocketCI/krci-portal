import { CLUSTER_FORM_NAMES } from "../../../constants";
import { useClusterSecretForm } from "../../../providers/form/hooks";
import { useClusterSecretData } from "../../../providers/data/hooks";
import { FORM_MODES } from "@/core/types/forms";
import { CopyToClipboardButton } from "@/core/components/FieldSuffixButtons";
import { ManagedByHelper } from "@/core/components/ManagedByHelper";
import { useStore } from "@tanstack/react-form";

export const ClusterHost = () => {
  const form = useClusterSecretForm();
  const { mode, ownerReference } = useClusterSecretData();
  const clusterHost = useStore(form.store, (state) => state.values[CLUSTER_FORM_NAMES.CLUSTER_HOST]);

  return (
    <form.AppField name={CLUSTER_FORM_NAMES.CLUSTER_HOST}>
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
          helperText={ownerReference ? <ManagedByHelper ownerReference={ownerReference} /> : undefined}
          suffix={<CopyToClipboardButton getValue={() => clusterHost} />}
        />
      )}
    </form.AppField>
  );
};
