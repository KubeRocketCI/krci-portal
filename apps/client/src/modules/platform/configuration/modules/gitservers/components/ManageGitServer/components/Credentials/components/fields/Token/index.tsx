import { NAMES } from "@/modules/platform/configuration/modules/gitservers/components/ManageGitServer/names";
import { useManageGitServerForm } from "@/modules/platform/configuration/modules/gitservers/components/ManageGitServer/providers/form/hooks";
import { useDataContext } from "@/modules/platform/configuration/modules/gitservers/components/ManageGitServer/providers/Data/hooks";

export const Token = () => {
  const form = useManageGitServerForm();
  const { gitServerSecret } = useDataContext();
  const gitServerSecretOwnerReference = gitServerSecret?.metadata?.ownerReferences?.[0].kind;

  return (
    <form.AppField name={NAMES.TOKEN}>
      {(field) => (
        <field.FormTextField
          type="password"
          label="Token"
          tooltipText="Provide the token for Git server authentication."
          placeholder="Enter token"
          helperText={
            gitServerSecretOwnerReference
              ? `This field value is managed by ${gitServerSecretOwnerReference}`
              : undefined
          }
          disabled={!!gitServerSecretOwnerReference}
        />
      )}
    </form.AppField>
  );
};
