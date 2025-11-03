import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { FORM_MODES } from "@/core/types/forms";
import { INTEGRATION_SECRET_FORM_NAMES } from "../../../../constants";
import { useFormsContext } from "../../../../hooks/useFormsContext";
import { useDataContext } from "../../../../providers/Data/hooks";

export const User = () => {
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
      {...register(INTEGRATION_SECRET_FORM_NAMES.USERNAME, {
        required: "Enter your Nexus username.",
      })}
      label={`User`}
      tooltipText={"Provide your Nexus repository username for authentication."}
      placeholder={"Enter user name"}
      control={control}
      errors={errors}
      disabled={mode === FORM_MODES.EDIT && !!ownerReference}
      TextFieldProps={{
        helperText: ownerReference && `This field value is managed by ${ownerReference}`,
      }}
    />
  );
};
