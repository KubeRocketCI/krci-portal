import { NAMES } from "../../../../../names";
import { useManageGitServerForm } from "../../../../../providers/form/hooks";
import { useDataContext } from "../../../../../providers/Data/hooks";

export const UserName = () => {
  const form = useManageGitServerForm();
  const { gitServerSecret } = useDataContext();
  const gitServerSecretOwnerReference = gitServerSecret?.metadata?.ownerReferences?.[0].kind;

  return (
    <form.AppField name={NAMES.GIT_USER}>
      {(field) => (
        <field.FormTextField
          label="User"
          tooltipText="Provide the username associated with your Git account."
          placeholder="git"
          disabled={!!gitServerSecretOwnerReference}
          helperText={
            gitServerSecretOwnerReference
              ? `This field value is managed by ${gitServerSecretOwnerReference}`
              : undefined
          }
        />
      )}
    </form.AppField>
  );
};
