import { NAMES } from "../../../constants";
import { useCreateNexusForm } from "../../../providers/form/hooks";

export const Password = () => {
  const form = useCreateNexusForm();

  return (
    <form.AppField name={NAMES.PASSWORD}>
      {(field) => (
        <field.FormTextField
          type="password"
          label="Password"
          tooltipText="Enter the password associated with your Nexus repository username."
          placeholder="Enter password"
        />
      )}
    </form.AppField>
  );
};
