import { useDataContext } from "../../../../providers/Data/hooks";
import { useManageRegistryForm } from "../../../../providers/form/hooks";
import { NAMES } from "../../../../schema";

export const PushAccountUser = () => {
  const form = useManageRegistryForm();
  const { pushAccountSecret } = useDataContext();

  const ownerReference = pushAccountSecret?.metadata?.ownerReferences?.[0].kind;

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
          helperText={ownerReference ? `This field value is managed by ${ownerReference}` : undefined}
          disabled={!!ownerReference}
        />
      )}
    </form.AppField>
  );
};
