import { FormSelect } from "@/core/providers/Form/components/FormSelect";
import React from "react";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { CODEBASE_FORM_NAMES } from "../../../names";
import { getGitServerStatusIcon, useGitServerWatchList } from "@/core/k8s/api/groups/KRCI/GitServer";
import { StatusIcon } from "@/core/components/StatusIcon";

export const GitServer = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useTypedFormContext();

  const gitServersWatch = useGitServerWatchList();

  const gitServersOptions = React.useMemo(
    () =>
      gitServersWatch.dataArray.map((gitServer) => {
        const connected = gitServer?.status?.connected;

        const statusIcon = getGitServerStatusIcon(connected);

        return {
          label: gitServer.metadata.name,
          value: gitServer.metadata.name,
          disabled: !gitServer.status?.connected,
          icon: <StatusIcon Icon={statusIcon.component} color={statusIcon.color} isSpinning={statusIcon.isSpinning} />,
        };
      }),
    [gitServersWatch.dataArray]
  );

  return (
    <FormSelect
      {...register(CODEBASE_FORM_NAMES.gitServer.name, {
        required: "Select an existing Git server",
      })}
      label={"Git server"}
      tooltipText={"Choose the Git server for hosting your repository."}
      control={control}
      errors={errors}
      options={gitServersOptions}
    />
  );
};
