import { STAGE_FORM_NAMES } from "../../../names";
import { useStageForm } from "../../../providers/form/hooks";

export const Description = () => {
  const form = useStageForm();

  return (
    <form.AppField
      name={STAGE_FORM_NAMES.description.name}
      validators={{
        onChange: ({ value }) => {
          if (!value) return "Enter description.";
          return undefined;
        },
      }}
    >
      {(field) => (
        <field.FormTextField
          label="Description"
          tooltipText="Provide a brief description of the environment to convey its purpose and characteristics."
          placeholder="Enter description"
        />
      )}
    </form.AppField>
  );
};
