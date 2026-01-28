import z from "zod";
import { useCreateStageForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";

export const Description = () => {
  const form = useCreateStageForm();

  return (
    <form.AppField
      name={NAMES.description}
      validators={{
        onChange: z.string().min(1, "Enter description"),
      }}
      children={(field) => <field.FormTextarea label="Description" placeholder="Enter environment description" />}
    />
  );
};
