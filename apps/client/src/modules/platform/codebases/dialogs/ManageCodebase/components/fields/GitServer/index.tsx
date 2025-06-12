import { K8sGitServer } from "@my-project/client/core/k8s/api/KRCI/GitServer";
import { FormSelect } from "@/core/providers/Form/components/FormSelect";
import React from "react";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { CODEBASE_FORM_NAMES } from "../../../names";
import { mapValuesToArray } from "@my-project/client/core/k8s/api/hooks/useWatchList";

export const GitServer = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useTypedFormContext();

  const gitServersQuery = K8sGitServer.useWatchList();

  const gitServersOptions = React.useMemo(
    () =>
      mapValuesToArray(gitServersQuery.data.items).map((gitServer) => {
        const connected = gitServer?.status?.connected;

        const icon = K8sGitServer.getStatusIcon(connected);

        return {
          label: gitServer.metadata.name,
          value: gitServer.metadata.name,
          disabled: !gitServer.status?.connected,
          icon: <icon.component color={icon.color} />,
        };
      }),
    [gitServersQuery.data.items]
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
