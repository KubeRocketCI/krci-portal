import { NAMES } from "@/modules/platform/configuration/modules/jira/components/ManageJiraServer/names";
import { useDataContext } from "@/modules/platform/configuration/modules/jira/components/ManageJiraServer/providers/Data/hooks";
import { useManageJiraServerForm } from "@/modules/platform/configuration/modules/jira/components/ManageJiraServer/providers/form/hooks";
import { ManagedByHelper } from "@/core/components/ManagedByHelper";

export const Password = () => {
  const form = useManageJiraServerForm();
  const { secret, ownerReference } = useDataContext();

  return (
    <form.AppField name={NAMES.PASSWORD}>
      {(field) => (
        <field.FormTextField
          type="password"
          label="Password"
          tooltipText="Provide the password associated with your Jira account."
          placeholder="Enter password"
          disabled={!!secret && !!ownerReference}
          helperText={ownerReference ? <ManagedByHelper ownerReference={ownerReference} /> : undefined}
        />
      )}
    </form.AppField>
  );
};
