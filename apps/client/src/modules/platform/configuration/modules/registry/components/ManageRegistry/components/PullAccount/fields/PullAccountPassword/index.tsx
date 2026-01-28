import { useDataContext } from "../../../../providers/Data/hooks";
import { useManageRegistryForm } from "../../../../providers/form/hooks";
import { NAMES } from "../../../../schema";

export const PullAccountPassword = () => {
  const form = useManageRegistryForm();
  const { pullAccountSecret } = useDataContext();

  const ownerReference = pullAccountSecret?.metadata?.ownerReferences?.[0].kind;

  return (
    <form.AppField name={NAMES.PULL_ACCOUNT_PASSWORD}>
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
