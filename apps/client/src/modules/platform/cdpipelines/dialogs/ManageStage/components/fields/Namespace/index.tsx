import { STAGE_FORM_NAMES } from "../../../names";
import { useStageForm } from "../../../providers/form/hooks";

const nameRequirementLabel = `Name must be not less than two characters long. It must contain only lowercase letters, numbers, and dashes. It cannot start or end with a dash, and cannot have whitespaces`;

export const Namespace = () => {
  const form = useStageForm();

  return (
    <form.AppField
      name={STAGE_FORM_NAMES.deployNamespace.name}
      validators={{
        onChange: ({ value }) => {
          if (!value) return "Enter namespace to deploy to";
          if (value.length > 63) {
            return "You exceeded the maximum length of 63";
          }
          if (value.length < 2) {
            return "You must enter at least 2 characters";
          }
          if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
            return nameRequirementLabel;
          }
          return undefined;
        },
      }}
    >
      {(field) => (
        <field.FormTextField
          label="Namespace"
          tooltipText="Target namespace for deploying environment workload."
          placeholder="Enter namespace to deploy to"
          editable
        />
      )}
    </form.AppField>
  );
};
