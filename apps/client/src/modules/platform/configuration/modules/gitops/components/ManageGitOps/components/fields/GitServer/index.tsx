import React from "react";
import { useFormContext as useReactHookFormContext } from "react-hook-form";
import { CODEBASE_FORM_NAMES } from "../../../names";
import { ManageGitOpsDataContext, ManageGitOpsValues } from "../../../types";
import { useFormContext } from "@/core/providers/Form/hooks";
import { FieldEvent } from "@/core/types/forms";
import { FormSelect } from "@/core/providers/Form/components/FormSelect";
import { getGitServerStatusIcon, useGitServerWatchList } from "@/k8s/api/groups/KRCI/GitServer";
import { StatusIcon } from "@/core/components/StatusIcon";
import { gitProvider } from "@my-project/shared";

export const GitServer = () => {
  const gitServersWatch = useGitServerWatchList();

  const gitServers = gitServersWatch.data.array;

  const gitServersOptions = React.useMemo(
    () =>
      gitServers
        ? gitServers.map((gitServer) => {
            const statusIcon = getGitServerStatusIcon(gitServer);

            return {
              label: gitServer.metadata.name,
              value: gitServer.metadata.name,
              disabled: !gitServer.status?.connected,
              icon: (
                <StatusIcon Icon={statusIcon.component} color={statusIcon.color} isSpinning={statusIcon.isSpinning} />
              ),
            };
          })
        : [],
    [gitServers]
  );

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

  const gitRepoPathFieldValue = watch(CODEBASE_FORM_NAMES.GIT_REPO_PATH);
  const nameFieldValue = watch(CODEBASE_FORM_NAMES.NAME);

  return (
    <FormSelect
      {...register(CODEBASE_FORM_NAMES.GIT_SERVER, {
        required: "Select an existing Git server",
        onChange: ({ target: { value } }: FieldEvent) => {
          const isGerrit = value === gitProvider.gerrit;

          setValue(
            CODEBASE_FORM_NAMES.GIT_URL_PATH,
            isGerrit ? `/${nameFieldValue}` : `${gitRepoPathFieldValue}/${nameFieldValue}`
          );
        },
      })}
      label={"Git server"}
      tooltipText={"Select an existing Git server"}
      control={control}
      errors={errors}
      options={gitServersOptions}
      disabled={isReadOnly}
    />
  );
};
