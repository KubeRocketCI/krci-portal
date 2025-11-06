import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { useFormsContext } from "../../../../hooks/useFormsContext";
import { INTEGRATION_SECRET_FORM_NAMES } from "../../../../constants";
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

  const { secret, ownerReference } = useDataContext();

  return (
    <FormTextField
      {...register(INTEGRATION_SECRET_FORM_NAMES.USERNAME, {
        required: "Enter your Jira username.",
      })}
      label={"User"}
      tooltipText={
        "Enter your Jira username for authentication. This is typically the username associated with your Jira account."
      }
      placeholder={"Enter user name"}
      control={control}
      errors={errors}
      disabled={!!secret && !!ownerReference}
      helperText={ownerReference ? `This field value is managed by ${ownerReference}` : undefined}
    />
  );
};
