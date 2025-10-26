import { validationRules } from "@/core/constants/validation";
import { useGitServerWatchList } from "@/k8s/api/groups/KRCI/GitServer";
import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { validateField } from "@/core/utils/forms/validation";
import { gitProvider } from "@my-project/shared";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { CODEBASE_FORM_NAMES } from "../../../names";

export const GitUrlPath = () => {
  const {
    register,
    control,
    formState: { errors },
    watch,
  } = useTypedFormContext();

  const gitServersWatch = useGitServerWatchList();

  const gitServerFieldValue = watch(CODEBASE_FORM_NAMES.gitServer.name);

  const gitServer = gitServersWatch.data.array.find((gitServer) => gitServer.metadata.name === gitServerFieldValue);

  const gitServerProvider = gitServer?.spec.gitProvider;

  const title =
    gitServerProvider === gitProvider.gitlab
      ? "Specify the codebase repository name in the following format: username/repository_name."
      : "Specify the codebase repository name.";

  const placeholder =
    gitServerProvider === gitProvider.gerrit ? "repository_name" : "username_or_organization/repository_name";

  return (
    <FormTextField
      {...register(CODEBASE_FORM_NAMES.gitUrlPath.name, {
        required: "Enter relative path to repository.",
        minLength: {
          value: 3,
          message: "Repository name has to be at least 3 characters long.",
        },
        validate: (value) => validateField(value as string, validationRules.GIT_URL_PATH),
      })}
      label={"Repository name"}
      tooltipText={title}
      placeholder={placeholder}
      control={control}
      errors={errors}
    />
  );
};
