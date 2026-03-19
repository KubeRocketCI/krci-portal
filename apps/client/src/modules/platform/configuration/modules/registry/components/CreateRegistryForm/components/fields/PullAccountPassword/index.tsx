import { useCreateRegistryForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../constants";

export const PullAccountPassword = () => {
  const form = useCreateRegistryForm();

  return (
    <form.AppField name={NAMES.PULL_ACCOUNT_PASSWORD}>
      {(field) => (
        <field.FormTextFieldPassword
          label="Password / Token"
          tooltipText="Enter the confidential combination used for authenticating your access to the container registry."
          placeholder="Enter password or token"
        />
      )}
    </form.AppField>
  );
};
