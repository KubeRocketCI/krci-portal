import { NAMES } from "@/modules/platform/configuration/modules/jira/components/ManageJiraServer/names";
import { useDataContext } from "@/modules/platform/configuration/modules/jira/components/ManageJiraServer/providers/Data/hooks";
import { useManageJiraServerForm } from "@/modules/platform/configuration/modules/jira/components/ManageJiraServer/providers/form/hooks";
import { ManagedByHelper } from "@/core/components/ManagedByHelper";

export const User = () => {
  const form = useManageJiraServerForm();
  const { secret, ownerReference } = useDataContext();

  return (
    <form.AppField name={NAMES.USERNAME}>
      {(field) => (
        <field.FormTextField
          label="User"
          tooltipText="Enter your Jira username for authentication. This is typically the username associated with your Jira account."
          placeholder="Enter user name"
          disabled={!!secret && !!ownerReference}
          helperText={ownerReference ? <ManagedByHelper ownerReference={ownerReference} /> : undefined}
        />
      )}
    </form.AppField>
  );
};
