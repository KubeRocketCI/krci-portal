import { LearnMoreLink } from "@/core/components/LearnMoreLink";
import { EDP_OPERATOR_GUIDE } from "@my-project/client/core/k8s/constants/docs-urls";
import { useJiraServerWatchList } from "@my-project/client/core/k8s/api/KRCI/JiraServer";
import { FormCheckbox } from "@/core/providers/Form/components/FormCheckbox";
import { FormControlLabelWithTooltip } from "@/core/providers/Form/components/FormControlLabelWithTooltip";
import { Alert, Grid } from "@mui/material";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { CODEBASE_FORM_NAMES } from "../../../names";

export const JiraServerIntegration = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useTypedFormContext();

  const jiraServerListWatch = useJiraServerWatchList();
  const jiraServerList = jiraServerListWatch.dataArray;

  return (
    <Grid container spacing={2}>
      {!jiraServerList.length ? (
        <Grid item xs={12}>
          <Alert severity="info" variant="outlined">
            There are no available Jira servers
          </Alert>
        </Grid>
      ) : null}
      <Grid item xs={12}>
        <Grid container spacing={1} alignItems={"center"}>
          <Grid item>
            <FormCheckbox
              {...register(CODEBASE_FORM_NAMES.hasJiraServerIntegration.name)}
              label={<FormControlLabelWithTooltip label={"Integrate with Jira server"} />}
              control={control}
              errors={errors}
              disabled={jiraServerListWatch.isEmpty}
            />{" "}
          </Grid>
          <Grid item>
            <LearnMoreLink url={EDP_OPERATOR_GUIDE.JIRA.url} />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};
