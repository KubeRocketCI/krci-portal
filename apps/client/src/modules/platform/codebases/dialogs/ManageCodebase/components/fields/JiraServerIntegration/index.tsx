import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { EDP_OPERATOR_GUIDE } from "@/k8s/constants/docs-urls";
import { FormCheckbox } from "@/core/providers/Form/components/FormCheckbox";
import { FormControlLabelWithTooltip } from "@/core/providers/Form/components/FormControlLabelWithTooltip";
import { Alert } from "@mui/material";
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

  return (
    <div className="flex flex-col gap-4">
      {!jiraServerList.length ? (
        <div>
          <Alert severity="info" variant="outlined">
            There are no available Jira servers
          </Alert>
        </div>
      ) : null}
      <div>
        <div className="flex gap-2 items-center">
          <div>
            <FormCheckbox
              {...register(CODEBASE_FORM_NAMES.hasJiraServerIntegration.name)}
              label={<FormControlLabelWithTooltip label={"Integrate with Jira server"} />}
              control={control}
              errors={errors}
              disabled={jiraServerListWatch.isEmpty}
            />{" "}
          </div>
          <div>
            <LearnMoreLink url={EDP_OPERATOR_GUIDE.JIRA.url} />
          </div>
        </div>
      </div>
    </div>
  );
};
