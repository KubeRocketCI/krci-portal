import { FormTextFieldPassword } from "@/core/providers/Form/components/FormTextFieldPassword";
import { FORM_MODES } from "@/core/types/forms";
import { useFormsContext } from "../../../../hooks/useFormsContext";
import { INTEGRATION_SECRET_FORM_NAMES } from "../../../../constants";
import { useDataContext } from "../../../../providers/Data/hooks";

export const Token = () => {
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
    <FormTextFieldPassword
      {...register(INTEGRATION_SECRET_FORM_NAMES.TOKEN, {
        required: "Enter token",
      })}
      label={"Token"}
      tooltipText={"Enter authentication token"}
      placeholder={"Enter token"}
      control={control}
      errors={errors}
      disabled={mode === FORM_MODES.EDIT && !!ownerReference}
      TextFieldProps={{
        helperText: ownerReference && `This field value is managed by ${ownerReference}`,
      }}
    />
  );
};
