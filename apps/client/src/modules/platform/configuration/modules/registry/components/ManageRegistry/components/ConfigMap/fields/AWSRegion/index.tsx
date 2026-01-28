import { useManageRegistryForm } from "../../../../providers/form/hooks";
import { NAMES } from "../../../../schema";

export const AWSRegion = () => {
  const form = useManageRegistryForm();

  return (
    <form.AppField name={NAMES.AWS_REGION}>
      {(field) => <field.FormTextField label="AWS Region" placeholder="Enter AWS region" />}
    </form.AppField>
  );
};
