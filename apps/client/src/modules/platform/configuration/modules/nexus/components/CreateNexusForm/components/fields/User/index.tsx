import { NAMES } from "../../../constants";
import { useCreateNexusForm } from "../../../providers/form/hooks";

export const User = () => {
  const form = useCreateNexusForm();

  return (
    <form.AppField name={NAMES.USERNAME}>
      {(field) => (
        <field.FormTextField
          label="User"
          tooltipText="Provide your Nexus repository username for authentication."
          placeholder="Enter user name"
        />
      )}
    </form.AppField>
  );
};
