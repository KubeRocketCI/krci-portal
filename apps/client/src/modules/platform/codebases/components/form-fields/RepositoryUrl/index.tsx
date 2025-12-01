import React from "react";
import { useFormContext } from "react-hook-form";
import { NAMES } from "../../../pages/create/components/CreateCodebaseWizard/names";
import { gitProvider } from "@my-project/shared";
import { FieldEvent } from "@/core/types/forms";
import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { useGitServerWatchList } from "@/k8s/api/groups/KRCI/GitServer";

interface RepositoryUrlFieldProps {
  disabled?: boolean;
}

export const RepositoryUrlField: React.FC<RepositoryUrlFieldProps> = ({ disabled = false }) => {
  const {
    register,
    control,
    formState: { errors },
    setValue,
  } = useFormContext();

  const fieldRequirementLabel =
    "Specify the application URL in the following format: http(s)://git.example.com/example.";
  const gitServersWatch = useGitServerWatchList();
  const gitServers = gitServersWatch.data.array;

  const hasGerritGitServer = React.useMemo(() => {
    return gitServers.some((el) => el.spec.gitProvider === gitProvider.gerrit);
  }, [gitServers]);

  return (
    <FormTextField
      {...register(NAMES.repositoryUrl, {
        onBlur: ({ target: { value } }: FieldEvent<string>) => {
          if (!value) {
            return;
          }

          const lastSegment = value.split("/").at(-1);
          const repoName = lastSegment ? lastSegment.replaceAll("/", "-") : "";

          setValue(NAMES.name, repoName);

          if (hasGerritGitServer) {
            return;
          }

          setValue(NAMES.gitUrlPath, repoName);
        },
      })}
      label={"Repository URL"}
      tooltipText={fieldRequirementLabel}
      placeholder={"http(s)://git.sample.com/sample"}
      control={control}
      errors={errors}
      disabled={disabled}
    />
  );
};
