import { CLUSTER_FORM_NAMES } from "../../../names";
import { useClusterSecretForm } from "../../../providers/form/hooks";
import { useClusterSecretData } from "../../../providers/data/hooks";
import { FORM_MODES } from "@/core/types/forms";

export const CaData = () => {
  const form = useClusterSecretForm();
  const { mode, ownerReference } = useClusterSecretData();

  return (
    <form.AppField
      name={CLUSTER_FORM_NAMES.CA_DATA}
      validators={{
        onChange: ({ value }) => {
          if (!value) return "Enter Certificate Authority Data.";
          return undefined;
        },
      }}
    >
      {(field) => (
        <field.FormTextField
          label="Certificate Authority Data"
          type="password"
          placeholder="Enter Certificate Authority Data."
          disabled={mode === FORM_MODES.EDIT && !!ownerReference}
          helperText={ownerReference ? `This field value is managed by ${ownerReference}` : undefined}
        />
      )}
    </form.AppField>
  );
};
