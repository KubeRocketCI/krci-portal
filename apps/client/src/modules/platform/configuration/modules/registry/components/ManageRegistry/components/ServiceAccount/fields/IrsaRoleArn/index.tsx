import { useManageRegistryForm } from "../../../../providers/form/hooks";
import { NAMES } from "../../../../schema";

export const IrsaRoleArn = () => {
  const form = useManageRegistryForm();

  return (
    <form.AppField name={NAMES.IRSA_ROLE_ARN}>
      {(field) => (
        <field.FormTextField
          label="IRSA Role ARN"
          tooltipText="Enter the IAM Role ARN for Service Accounts (IRSA). This role will be assigned to the platform's service account for accessing the registry on your behalf."
          placeholder="Enter IRSA Role ARN"
        />
      )}
    </form.AppField>
  );
};
