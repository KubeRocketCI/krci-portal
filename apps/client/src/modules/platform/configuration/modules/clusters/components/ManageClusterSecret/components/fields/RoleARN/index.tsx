import { CLUSTER_FORM_NAMES } from "../../../names";
import { useClusterSecretForm } from "../../../providers/form/hooks";
import { useClusterSecretData } from "../../../providers/data/hooks";
import { FORM_MODES } from "@/core/types/forms";

export const RoleARN = () => {
  const form = useClusterSecretForm();
  const { mode, ownerReference } = useClusterSecretData();

  return (
    <form.AppField
      name={CLUSTER_FORM_NAMES.ROLE_ARN}
      validators={{
        onChange: ({ value }) => {
          if (!value) return "Enter Role ARN.";
          return undefined;
        },
      }}
    >
      {(field) => (
        <field.FormTextField
          label="Role ARN"
          type="password"
          placeholder="Enter Role ARN."
          disabled={mode === FORM_MODES.EDIT && !!ownerReference}
          helperText={ownerReference ? `This field value is managed by ${ownerReference}` : undefined}
        />
      )}
    </form.AppField>
  );
};
