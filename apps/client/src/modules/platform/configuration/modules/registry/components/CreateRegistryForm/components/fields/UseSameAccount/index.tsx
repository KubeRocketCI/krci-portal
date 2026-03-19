import { useCreateRegistryForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../constants";

export const UseSameAccount = () => {
  const form = useCreateRegistryForm();

  return (
    <form.AppField
      name={NAMES.USE_SAME_ACCOUNT}
      listeners={{
        onChange: ({ value }) => {
          if (value) {
            const pushAccountUser = form.store.state.values[NAMES.PUSH_ACCOUNT_USER];
            const pushAccountPassword = form.store.state.values[NAMES.PUSH_ACCOUNT_PASSWORD];

            form.setFieldValue(NAMES.PULL_ACCOUNT_USER, pushAccountUser ?? "");
            form.setFieldValue(NAMES.PULL_ACCOUNT_PASSWORD, pushAccountPassword ?? "");
          }
        },
      }}
    >
      {(field) => (
        <field.FormSwitchRich
          label="Use the Push Account's credentials"
          helperText="Enables using the same account for both pull and push purposes."
        />
      )}
    </form.AppField>
  );
};
