import { useDataContext } from "../../../../providers/Data/hooks";
import { useManageRegistryForm } from "../../../../providers/form/hooks";
import { NAMES } from "../../../../schema";

export const PushAccountPassword = () => {
  const form = useManageRegistryForm();
  const { pushAccountSecret } = useDataContext();

  const ownerReference = pushAccountSecret?.metadata?.ownerReferences?.[0].kind;

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
          helperText={ownerReference ? `This field value is managed by ${ownerReference}` : undefined}
          disabled={!!ownerReference}
        />
      )}
    </form.AppField>
  );
};
