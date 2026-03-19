import { useEditRegistryForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../constants";

interface PullAccountUserProps {
  ownerReference?: string;
}

export const PullAccountUser = ({ ownerReference }: PullAccountUserProps) => {
  const form = useEditRegistryForm();

  return (
    <form.AppField name={NAMES.PULL_ACCOUNT_USER}>
      {(field) => (
        <field.FormTextField
          label="User"
          tooltipText="Provide the unique identifier linked to your user account on the container registry."
          placeholder="Enter user name"
          disabled={!!ownerReference}
        />
      )}
    </form.AppField>
  );
};
