import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { useFormsContext } from "../../../../../hooks/useFormsContext";
import { GIT_SERVER_FORM_NAMES } from "../../../../../names";
import { FORM_MODES } from "@/core/types/forms";

const nameRequirementLabel = `Name must be not less than two characters long. It must contain only lowercase letters, numbers, and dashes. It cannot start or end with a dash, and cannot have whitespaces`;

export const Name = () => {
  const {
    forms: { gitServer: gitServerForm },
  } = useFormsContext();

  return (
    <FormTextField
      {...gitServerForm.form.register(GIT_SERVER_FORM_NAMES.NAME, {
        required: "Enter the Git server name.",
        pattern: {
          value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
          message: nameRequirementLabel,
        },
      })}
      label={"Name"}
      tooltipText={"Enter the name of your Git Server (e.g., my-github)."}
      placeholder={"my-github"}
      control={gitServerForm.form.control}
      errors={gitServerForm.form.formState.errors}
      disabled={gitServerForm.mode === FORM_MODES.EDIT}
    />
  );
};
