import { CLUSTER_FORM_NAMES } from "../../../names";
import { useClusterSecretForm } from "../../../providers/form/hooks";
import { useClusterSecretData } from "../../../providers/data/hooks";
import { FORM_MODES } from "@/core/types/forms";

export const SkipTLSVerify = () => {
  const form = useClusterSecretForm();
  const { mode, ownerReference } = useClusterSecretData();

  return (
    <form.AppField name={CLUSTER_FORM_NAMES.SKIP_TLS_VERIFY}>
      {(field) => (
        <field.FormSwitch
          label="Skip TLS verification"
          rich
          variant="card"
          disabled={mode === FORM_MODES.EDIT && !!ownerReference}
        />
      )}
    </form.AppField>
  );
};
