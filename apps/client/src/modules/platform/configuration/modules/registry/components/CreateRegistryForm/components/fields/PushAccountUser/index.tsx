import { useCreateRegistryForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../constants";

export const PushAccountUser = () => {
  const form = useCreateRegistryForm();

  return (
    <form.AppField
      name={NAMES.PUSH_ACCOUNT_USER}
      listeners={{
        onChange: ({ value }) => {
          const useSameAccount = form.store.state.values[NAMES.USE_SAME_ACCOUNT];
          if (useSameAccount) {
            form.setFieldValue(NAMES.PULL_ACCOUNT_USER, value as string);
          }
        },
      }}
    >
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
