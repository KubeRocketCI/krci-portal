import { FormSwitchRich } from "@/core/providers/Form/components/FormSwitchRich";
import { Alert } from "@/core/components/ui/alert";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { CODEBASE_FORM_NAMES } from "../../../names";
import { useJiraServerWatchList } from "@/k8s/api/groups/KRCI/JiraServer";

export const JiraServerIntegration = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useTypedFormContext();

  const jiraServerListWatch = useJiraServerWatchList();
  const jiraServerList = jiraServerListWatch.data.array;

  const hasNoJiraServers = !jiraServerList.length;

  return (
    <div className={hasNoJiraServers ? "flex gap-4" : "w-full"}>
      {hasNoJiraServers && (
        <div className="w-1/2">
          <Alert variant="default">There are no available Jira servers</Alert>
        </div>
      )}
      <div className={hasNoJiraServers ? "w-1/2" : "w-full"}>
        <FormSwitchRich
          {...register(CODEBASE_FORM_NAMES.hasJiraServerIntegration.name)}
          label="Integrate with Jira server"
          helperText="Enable this to integrate with Jira server. This will allow you to create Jira issues from the codebase."
          control={control}
          errors={errors}
          disabled={jiraServerListWatch.isEmpty}
        />
      </div>
    </div>
  );
};
