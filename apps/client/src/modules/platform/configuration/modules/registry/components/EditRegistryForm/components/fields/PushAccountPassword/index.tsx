import { useEditRegistryForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../constants";

interface PushAccountPasswordProps {
  ownerReference?: string;
}

export const PushAccountPassword = ({ ownerReference }: PushAccountPasswordProps) => {
  const form = useEditRegistryForm();

  return (
    <form.AppField
      name={NAMES.PUSH_ACCOUNT_PASSWORD}
      listeners={{
        onChange: ({ value }) => {
          const useSameAccount = form.store.state.values[NAMES.USE_SAME_ACCOUNT];
          if (useSameAccount) {
            form.setFieldValue(NAMES.PULL_ACCOUNT_PASSWORD, value as string);
          }
        },
      }}
    >
      {(field) => (
        <field.FormTextFieldPassword
          label="Password / Token"
          tooltipText="Enter the confidential combination used for authenticating your access to the container registry."
          placeholder="Enter password or token"
          disabled={!!ownerReference}
        />
      )}
    </form.AppField>
  );
};
