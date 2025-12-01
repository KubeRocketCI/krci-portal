import { useGitServerWatchList } from "@/k8s/api/groups/KRCI/GitServer";
import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { gitProvider } from "@my-project/shared";
import React from "react";
import { useFormContext } from "react-hook-form";
import { NAMES } from "../../../pages/create/components/CreateCodebaseWizard/names";

export const GitUrlPathField: React.FC = () => {
  const {
    register,
    control,
    formState: { errors },
    watch,
  } = useFormContext();

  const gitServersWatch = useGitServerWatchList();

  const gitServerFieldValue = watch(NAMES.gitServer);

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
      {...register(NAMES.gitUrlPath)}
      label={"Repository name"}
      tooltipText={title}
      placeholder={placeholder}
      control={control}
      errors={errors}
    />
  );
};
