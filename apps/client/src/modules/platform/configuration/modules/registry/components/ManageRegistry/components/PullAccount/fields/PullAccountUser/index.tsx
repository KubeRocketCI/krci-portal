import { useDataContext } from "../../../../providers/Data/hooks";
import { useManageRegistryForm } from "../../../../providers/form/hooks";
import { NAMES } from "../../../../schema";

export const PullAccountUser = () => {
  const form = useManageRegistryForm();
  const { pullAccountSecret } = useDataContext();

  const ownerReference = pullAccountSecret?.metadata?.ownerReferences?.[0].kind;

  return (
    <form.AppField name={NAMES.PULL_ACCOUNT_USER}>
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
