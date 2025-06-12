import React from "react";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { CODEBASE_FORM_NAMES } from "../../../names";
import { K8sGitServer } from "@my-project/client/core/k8s/api/KRCI/GitServer";
import { mapValuesToArray } from "@my-project/client/core/k8s/api/hooks/useWatchList";
import { gitProvider } from "@my-project/shared";
import { FieldEvent } from "@/core/types/forms";
import { FormTextField } from "@/core/providers/Form/components/FormTextField";

export const RepositoryUrl = () => {
  const {
    register,
    control,
    formState: { errors },
    setValue,
  } = useTypedFormContext();

  const fieldRequirementLabel =
    "Specify the application URL in the following format: http(s)://git.example.com/example.";
  const gitServersWatchQuery = K8sGitServer.useWatchList();
  const gitServers = mapValuesToArray(gitServersWatchQuery.data.items);

  const hasGerritGitServer = React.useMemo(() => {
    return gitServers.some((el) => el.spec.gitProvider === gitProvider.gerrit);
  }, [gitServers]);

  return (
    <FormTextField
      {...register(CODEBASE_FORM_NAMES.repositoryUrl.name, {
        required: fieldRequirementLabel,
        pattern: {
          value: /((git|ssh|http(s)?)|(git@[\w.]+))(:(\/\/)?)([\w.@/~-]+)\w/,
          message: fieldRequirementLabel,
        },
        onBlur: ({ target: { value } }: FieldEvent<string>) => {
          if (!value) {
            return;
          }

          const lastSegment = value.split("/").at(-1);
          const repoName = lastSegment ? lastSegment.replaceAll("/", "-") : "";

          setValue(CODEBASE_FORM_NAMES.name.name, repoName);

          if (hasGerritGitServer) {
            return;
          }

          setValue(CODEBASE_FORM_NAMES.gitUrlPath.name, repoName);
        },
      })}
      label={"Repository URL"}
      tooltipText={fieldRequirementLabel}
      placeholder={"http(s)://git.sample.com/sample"}
      control={control}
      errors={errors}
    />
  );
};
