import React from "react";
import { FormSelect } from "@/core/providers/Form/components/FormSelect";
import { mapArrayToSelectOptions } from "@/core/utils/forms/mapToSelectOptions";
import { useFormContext } from "react-hook-form";
import { CREATE_WIZARD_NAMES } from "../names";
import { useJiraServerWatchList } from "@/k8s/api/groups/KRCI/JiraServer";

interface JiraServerFieldProps {
  name?: string;
}

export const JiraServerField: React.FC<JiraServerFieldProps> = ({
  name = CREATE_WIZARD_NAMES.jiraServer,
}) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  const jiraServerListWatch = useJiraServerWatchList();
  const jiraServerList = jiraServerListWatch.data.array;
  const jiraServersNames = jiraServerList.map((jiraServer) => jiraServer.metadata.name);

  return (
    <FormSelect
      {...register(name, {
        required: "Select Jira server that will be integrated with the codebase.",
      })}
      label={"Jira server"}
      tooltipText={"Select the Jira server to link your component with relevant project tasks."}
      control={control}
      errors={errors}
      options={mapArrayToSelectOptions(jiraServersNames)}
    />
  );
};
