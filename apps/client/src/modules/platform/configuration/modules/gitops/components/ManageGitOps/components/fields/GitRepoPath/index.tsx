import { useFormContext as useReactHookFormContext } from "react-hook-form";
import { CODEBASE_FORM_NAMES } from "../../../names";
import { ManageGitOpsDataContext, ManageGitOpsValues } from "../../../types";
import { useFormContext } from "@/core/providers/Form/hooks";
import { validationRules } from "@/core/constants/validation";
import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { FieldEvent } from "@/core/types/forms";
import { validateField } from "@/core/utils/forms/validation";
import { gitProvider } from "@my-project/shared";

// relative path should always start with slash

const slashSymbol = "/";

export const GitRepoPath = () => {
  const {
    register,
    control,
    formState: { errors },
    watch,
    setValue,
  } = useReactHookFormContext<ManageGitOpsValues>();

  const {
    formData: { isReadOnly },
  } = useFormContext<ManageGitOpsDataContext>();

  const gitServerFieldValue = watch(CODEBASE_FORM_NAMES.GIT_REPO_PATH);
  const nameFieldValue = watch(CODEBASE_FORM_NAMES.NAME);

  return (
    <FormTextField
      {...register(CODEBASE_FORM_NAMES.GIT_REPO_PATH, {
        required: "Enter relative path to repository.",
        validate: (value) => validateField(value, validationRules.GIT_URL_PATH),
        onChange: ({ target: { value } }: FieldEvent) => {
          const isGerrit = gitServerFieldValue === gitProvider.gerrit;

          setValue(CODEBASE_FORM_NAMES.GIT_URL_PATH, isGerrit ? `/${nameFieldValue}` : `${value}/${nameFieldValue}`);
        },
      })}
      label={"Git repo relative path"}
      tooltipText={"Enter your account name where the repository will be stored."}
      placeholder={"Indicate the repository relative path in the following format project/repository"}
      control={control}
      errors={errors}
      prefix={slashSymbol}
      disabled={isReadOnly}
    />
  );
};
