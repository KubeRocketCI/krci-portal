import { useEditRegistryForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../constants";

interface PullAccountPasswordProps {
  ownerReference?: string;
}

export const PullAccountPassword = ({ ownerReference }: PullAccountPasswordProps) => {
  const form = useEditRegistryForm();

  return (
    <form.AppField name={NAMES.PULL_ACCOUNT_PASSWORD}>
      {(field) => (
        <field.FormTextFieldPassword
          label="Password / Token"
          tooltipText="Enter the confidential combination used for authenticating your access to the container registry."
          placeholder="Enter password or token"
          disabled={!!ownerReference}
        />
      )}
    </form.AppField>
  );
};
