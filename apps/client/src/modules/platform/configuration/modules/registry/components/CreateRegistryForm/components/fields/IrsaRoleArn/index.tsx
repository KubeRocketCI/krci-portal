import { useCreateRegistryForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../constants";

export const IrsaRoleArn = () => {
  const form = useCreateRegistryForm();

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
