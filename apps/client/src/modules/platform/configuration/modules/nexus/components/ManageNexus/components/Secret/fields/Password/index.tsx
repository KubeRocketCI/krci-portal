import { FormTextFieldPassword } from "@/core/providers/Form/components/FormTextFieldPassword";
import { FORM_MODES } from "@/core/types/forms";
import { INTEGRATION_SECRET_FORM_NAMES } from "../../../../constants";
import { useFormsContext } from "../../../../hooks/useFormsContext";
import { useDataContext } from "../../../../providers/Data/hooks";

export const Password = () => {
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
      {...register(INTEGRATION_SECRET_FORM_NAMES.PASSWORD, {
        required: "Provide the password associated with your Nexus repository username.",
      })}
      label={`Password`}
      tooltipText={"Enter the password associated with your Nexus repository username."}
      placeholder={"Enter password"}
      control={control}
      errors={errors}
      disabled={mode === FORM_MODES.EDIT && !!ownerReference}
      TextFieldProps={{
        helperText: ownerReference && `This field value is managed by ${ownerReference}`,
      }}
    />
  );
};
