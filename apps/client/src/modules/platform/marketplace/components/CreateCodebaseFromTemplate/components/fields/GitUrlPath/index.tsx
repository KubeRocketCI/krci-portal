import { InputAdornment } from "@mui/material";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { CODEBASE_FROM_TEMPLATE_FORM_NAMES } from "../../../names";
import { gitProvider } from "@my-project/shared";
import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { validationRules } from "@/core/constants/validation";
import { validateField } from "@/core/utils/forms/validation";

const slashSymbol = "/";

export const GitUrlPath = () => {
  const {
    register,
    control,
    formState: { errors },
    watch,
  } = useTypedFormContext();

  const gitServerFieldValue = watch(CODEBASE_FROM_TEMPLATE_FORM_NAMES.GIT_SERVER);

  const title =
    gitServerFieldValue === gitProvider.gitlab
      ? "Specify the codebase repository name in the following format: username/repository_name."
      : "Specify the codebase repository name.";

  return (
    <FormTextField
      {...register(CODEBASE_FROM_TEMPLATE_FORM_NAMES.GIT_URL_PATH, {
        required: "Enter relative path to repository.",
        validate: (value) => validateField(value, validationRules.GIT_URL_PATH),
      })}
      label={"Repository name"}
      tooltipText={title}
      placeholder={"Indicate the repository relative path in the following format project/repository"}
      control={control}
      errors={errors}
      TextFieldProps={{
        InputProps: {
          startAdornment: <InputAdornment position="start">{slashSymbol}</InputAdornment>,
        },
      }}
    />
  );
};
