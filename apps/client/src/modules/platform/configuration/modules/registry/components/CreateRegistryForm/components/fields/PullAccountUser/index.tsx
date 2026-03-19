import { useCreateRegistryForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../constants";

export const PullAccountUser = () => {
  const form = useCreateRegistryForm();

  return (
    <form.AppField name={NAMES.PULL_ACCOUNT_USER}>
      {(field) => (
        <field.FormTextField
          label="User"
          tooltipText="Provide the unique identifier linked to your user account on the container registry."
          placeholder="Enter user name"
        />
      )}
    </form.AppField>
  );
};
