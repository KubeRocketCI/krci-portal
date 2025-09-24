import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { FORM_MODES } from "@/core/types/forms";
import { useFormsContext } from "../../../../hooks/useFormsContext";
import { INTEGRATION_SECRET_FORM_NAMES } from "../../../../constants";
import { useDataContext } from "../../../../providers/Data/hooks";

export const AssistantId = () => {
  const {
    forms: {
      secret: {
        form: {
          register,
          control,
          formState: { errors },
        },
      },
    },
  } = useFormsContext();

  const { mode, ownerReference } = useDataContext();

  return (
    <FormTextField
      {...register(INTEGRATION_SECRET_FORM_NAMES.ASSISTANT_ID, {
        required: "Enter Assistant ID.",
      })}
      label={"Assistant ID"}
      tooltipText={"Enter the Assistant ID for your Chat Assistant instance."}
      placeholder={"Enter Assistant ID"}
      control={control}
      errors={errors}
      disabled={mode === FORM_MODES.EDIT && !!ownerReference}
      TextFieldProps={{
        helperText: ownerReference && `This field value is managed by ${ownerReference}`,
      }}
    />
  );
};
