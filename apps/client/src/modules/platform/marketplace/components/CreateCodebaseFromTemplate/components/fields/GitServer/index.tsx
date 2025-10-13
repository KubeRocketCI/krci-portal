import React from "react";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { CODEBASE_FROM_TEMPLATE_FORM_NAMES } from "../../../names";
import { useGitServerWatchList } from "@/k8s/api/groups/KRCI/GitServer/hooks";
import { getGitServerStatusIcon } from "@/k8s/api/groups/KRCI/GitServer";
import { StatusIcon } from "@/core/components/StatusIcon";
import { FormSelect } from "@/core/providers/Form/components/FormSelect";

export const GitServer = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useTypedFormContext();

  const gitServersWatch = useGitServerWatchList();
  const gitServers = gitServersWatch.dataArray;

  const gitServersOptions = React.useMemo(
    () =>
      (gitServers || []).map((gitServer) => {
        const statusIcon = getGitServerStatusIcon(gitServer);

        return {
          label: gitServer.metadata.name,
          value: gitServer.metadata.name,
          disabled: !gitServer.status?.connected,
          icon: <StatusIcon Icon={statusIcon.component} color={statusIcon.color} isSpinning={statusIcon.isSpinning} />,
        };
      }),
    [gitServers]
  );

  return (
    <FormSelect
      {...register(CODEBASE_FROM_TEMPLATE_FORM_NAMES.GIT_SERVER, {
        required: "Select an existing Git server.",
      })}
      label={"Git server"}
      tooltipText={"Choose the Git server for hosting your repository."}
      control={control}
      errors={errors}
      options={gitServersOptions}
    />
  );
};
