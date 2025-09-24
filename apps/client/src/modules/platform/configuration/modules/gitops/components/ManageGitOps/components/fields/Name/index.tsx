import { InputAdornment } from "@mui/material";
import { useFormContext as useReactHookFormContext } from "react-hook-form";
import { CODEBASE_FORM_NAMES } from "../../../names";
import { ManageGitOpsDataContext, ManageGitOpsValues } from "../../../types";
import { useFormContext } from "@/core/providers/Form/hooks";
import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { FieldEvent } from "@/core/types/forms";
import { gitProvider } from "@my-project/shared";

const slashSymbol = "/";

export const Name = () => {
  const {
    register,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useReactHookFormContext<ManageGitOpsValues>();

  const {
    formData: { isReadOnly },
  } = useFormContext<ManageGitOpsDataContext>();

  const gitRepoPathFieldValue = watch(CODEBASE_FORM_NAMES.GIT_REPO_PATH);
  const gitServerFieldValue = watch(CODEBASE_FORM_NAMES.GIT_SERVER);

  return (
    <FormTextField
      {...register(CODEBASE_FORM_NAMES.NAME, {
        onChange: ({ target: { value } }: FieldEvent) => {
          const isGerrit = gitServerFieldValue === gitProvider.gerrit;

          setValue(CODEBASE_FORM_NAMES.GIT_URL_PATH, isGerrit ? `/${value}` : `${gitRepoPathFieldValue}/${value}`);
        },
      })}
      label={"Repository Name"}
      tooltipText={"Specify a unique repository name."}
      control={control}
      errors={errors}
      TextFieldProps={{
        InputProps: {
          startAdornment: <InputAdornment position="start">{slashSymbol}</InputAdornment>,
        },
      }}
      disabled={isReadOnly}
    />
  );
};
