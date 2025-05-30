import { useJiraServerWatchList } from "@my-project/client/core/k8s/api/KRCI/JiraServer";
import { FormSelect } from "@/core/providers/Form/components/FormSelect";
import { mapArrayToSelectOptions } from "@/core/utils/forms/mapToSelectOptions";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { CODEBASE_FORM_NAMES } from "../../../names";

export const JiraServer = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useTypedFormContext();

  const jiraServerListWatch = useJiraServerWatchList();
  const jiraServerList = jiraServerListWatch.dataArray;
  const jiraServersNames = jiraServerList.map((jiraServer) => jiraServer.metadata.name);

  return (
    <FormSelect
      {...register(CODEBASE_FORM_NAMES.jiraServer.name, {
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
