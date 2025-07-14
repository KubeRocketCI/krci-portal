import { FormCheckbox } from "@/core/providers/Form/components/FormCheckbox";
import { FormControlLabelWithTooltip } from "@/core/providers/Form/components/FormControlLabelWithTooltip";
import { useClusterStore } from "@/core/store";
import { FORM_MODES, FieldEvent } from "@/core/types/forms";
import { Alert, Grid } from "@mui/material";
import { useShallow } from "zustand/react/shallow";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { CODEBASE_FORM_NAMES } from "../../../names";
import { useCurrentDialog } from "../../../providers/CurrentDialog/hooks";
import { useCodemieWatchItem } from "@/core/k8s/api/groups/KRCI/Codemie";
import { useCodemieProjectWatchItem } from "@/core/k8s/api/groups/KRCI/CodemieProject";

export const CodemieIntegration = () => {
  const {
    register,
    control,
    formState: { errors },
    setValue,
  } = useTypedFormContext();

  const {
    props: { codebase },
  } = useCurrentDialog();

  const namespace = useClusterStore(useShallow((state) => state.defaultNamespace));

  const mode = codebase ? FORM_MODES.EDIT : FORM_MODES.CREATE;

  const codemieWatchQuery = useCodemieWatchItem({
    name: "codemie",
    namespace,
    queryOptions: {
      enabled: !!namespace,
    },
  });
  const codemieProjectWatchQuery = useCodemieProjectWatchItem({
    name: namespace,
    namespace,
    queryOptions: {
      enabled: !!namespace,
    },
  });

  const hasCodemieAndProject = codemieWatchQuery.query.data && codemieProjectWatchQuery.query.data;
  const hasError = codemieWatchQuery.query.error || codemieProjectWatchQuery.query.error;
  const codemieStatusIsOk = !!codemieWatchQuery.query.data?.status?.connected;
  const codemieProjectStatusIsOk = codemieProjectWatchQuery.query.data?.status?.value === "created";

  return (
    <Grid container spacing={2}>
      {!hasCodemieAndProject ? (
        <Grid item xs={12}>
          <Alert severity="info" variant="outlined">
            There is no Codemie or CodemieProject available
          </Alert>
        </Grid>
      ) : null}
      <Grid item xs={12}>
        <Grid container spacing={1} alignItems={"center"}>
          <Grid item>
            <FormCheckbox
              {...register(CODEBASE_FORM_NAMES.hasCodemieIntegration.name, {
                onChange: ({ target: { value } }: FieldEvent) => {
                  if (value) {
                    setValue(CODEBASE_FORM_NAMES.codemieIntegrationLabel.name, "codemie");
                  } else {
                    setValue(CODEBASE_FORM_NAMES.codemieIntegrationLabel.name, "");
                  }
                },
              })}
              label={<FormControlLabelWithTooltip label={"Integrate with Codemie"} />}
              control={control}
              errors={errors}
              disabled={
                !hasCodemieAndProject ||
                !codemieStatusIsOk ||
                !codemieProjectStatusIsOk ||
                !!hasError ||
                mode === FORM_MODES.EDIT
              }
            />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};
