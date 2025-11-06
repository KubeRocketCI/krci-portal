import { FormTextFieldPassword } from "@/core/providers/Form/components/FormTextFieldPassword";
import { useFormsContext } from "../../../../hooks/useFormsContext";
import { INTEGRATION_SECRET_FORM_NAMES } from "../../../../constants";
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

  const { secret, ownerReference } = useDataContext();

  return (
    <FormTextFieldPassword
      {...register(INTEGRATION_SECRET_FORM_NAMES.PASSWORD, {
        required: "Enter your Jira password.",
      })}
      label={"Password"}
      tooltipText={"Provide the password associated with your Jira account."}
      placeholder={"Enter password"}
      control={control}
      errors={errors}
      disabled={!!secret && !!ownerReference}
      helperText={ownerReference ? `This field value is managed by ${ownerReference}` : undefined}
    />
  );
};
