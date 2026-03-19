import { useEditRegistryForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../constants";

interface PushAccountUserProps {
  ownerReference?: string;
}

export const PushAccountUser = ({ ownerReference }: PushAccountUserProps) => {
  const form = useEditRegistryForm();

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
          disabled={!!ownerReference}
        />
      )}
    </form.AppField>
  );
};
