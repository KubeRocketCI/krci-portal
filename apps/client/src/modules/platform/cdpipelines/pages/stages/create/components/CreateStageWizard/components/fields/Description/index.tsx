import { useCreateStageForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";

export const Description = () => {
  const form = useCreateStageForm();

  return (
    <form.AppField
      name={NAMES.description}
      children={(field) => <field.FormTextarea label="Description" placeholder="Enter environment description" />}
    />
  );
};
