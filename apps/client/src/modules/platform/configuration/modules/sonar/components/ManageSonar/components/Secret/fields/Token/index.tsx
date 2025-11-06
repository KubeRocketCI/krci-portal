import { FormTextFieldPassword } from "@/core/providers/Form/components/FormTextFieldPassword";
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

  const { ownerReference } = useDataContext();

  return (
    <FormTextFieldPassword
      {...register(INTEGRATION_SECRET_FORM_NAMES.TOKEN, {
        required: "Enter the API token for SonarQube authentication.",
      })}
      label={`Token`}
      tooltipText={
        "Provide an API token for authentication with SonarQube. Generate the token from your SonarQube instance."
      }
      placeholder={"Enter token"}
      control={control}
      errors={errors}
      disabled={!!ownerReference}
      helperText={ownerReference ? `This field value is managed by ${ownerReference}` : undefined}
    />
  );
};
