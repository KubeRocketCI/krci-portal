import { FormSelect } from "@/core/providers/Form/components/FormSelect";
import React from "react";
import { useFormContext } from "react-hook-form";
import { NAMES } from "../../../pages/create/components/CreateCodebaseWizard/names";
import { getGitServerStatusIcon, useGitServerWatchList } from "@/k8s/api/groups/KRCI/GitServer";
import { StatusIcon } from "@/core/components/StatusIcon";

export const GitServerField: React.FC = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  const gitServersWatch = useGitServerWatchList();

  const gitServersOptions = React.useMemo(
    () =>
      gitServersWatch.data.array.map((gitServer) => {
        const statusIcon = getGitServerStatusIcon(gitServer);

        return {
          label: gitServer.metadata.name,
          value: gitServer.metadata.name,
          disabled: !gitServer.status?.connected,
          icon: <StatusIcon Icon={statusIcon.component} color={statusIcon.color} isSpinning={statusIcon.isSpinning} />,
        };
      }),
    [gitServersWatch.data.array]
  );

  return (
    <FormSelect
      {...register(NAMES.gitServer)}
      label={"Git server"}
      tooltipText={"Choose the Git server for hosting your repository."}
      control={control}
      errors={errors}
      options={gitServersOptions}
    />
  );
};
