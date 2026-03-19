import { useCreateRegistryForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../constants";

export const AWSRegion = () => {
  const form = useCreateRegistryForm();

  return (
    <form.AppField name={NAMES.AWS_REGION}>
      {(field) => <field.FormTextField label="AWS Region" placeholder="Enter AWS region" />}
    </form.AppField>
  );
};
