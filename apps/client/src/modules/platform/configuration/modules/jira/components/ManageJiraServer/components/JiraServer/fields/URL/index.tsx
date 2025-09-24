import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { getValidURLPattern } from "@/core/utils/getValidURLPattern";
import { VALIDATED_PROTOCOL } from "@/k8s/constants/validatedProtocols";
import { useFormsContext } from "../../../../hooks/useFormsContext";
import { JIRA_SERVER_FORM_NAMES } from "../../../../constants";

export const URL = () => {
  const {
    forms: {
      jiraServer: {
        form: {
          register,
          control,
          formState: { errors },
        },
      },
    },
  } = useFormsContext();

  return (
    <FormTextField
      {...register(JIRA_SERVER_FORM_NAMES.URL, {
        required: "Enter Jira URL (e.g., https://your-jira-instance.com).",
        pattern: {
          value: getValidURLPattern(VALIDATED_PROTOCOL.STRICT_HTTPS),
          message: "Enter a valid URL with HTTPS protocol.",
        },
      })}
      label={"URL"}
      tooltipText={
        "Provide the base URL of your Jira instance without any specific paths or endpoints (e.g., https://your-jira-instance.com)."
      }
      placeholder={"Enter Jira URL"}
      control={control}
      errors={errors}
    />
  );
};
