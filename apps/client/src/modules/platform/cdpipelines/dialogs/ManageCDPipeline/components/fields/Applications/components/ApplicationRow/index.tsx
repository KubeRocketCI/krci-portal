import { Grid, IconButton, useTheme } from "@mui/material";
import React from "react";
import { useTypedFormContext } from "../../../../../hooks/useFormContext";
import { CDPIPELINE_FORM_NAMES, NAMES } from "../../../../../names";
import { useCurrentDialog } from "../../../../../providers/CurrentDialog/hooks";
import { useStyles } from "./styles";
import { ApplicationRowProps } from "./types";
import { useCodebaseBranchWatchList } from "@/core/k8s/api/groups/KRCI/CodebaseBranch/hooks";
import { codebaseBranchLabels, sortKubeObjectByCreationTimestamp } from "@my-project/shared";
import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { FormAutocompleteSingle } from "@/core/providers/Form/components/FormAutocompleteSingle";
import { FieldEvent } from "@/core/types/forms";
import { ValueOf } from "@/core/types/global";
import { FORM_CONTROL_LABEL_HEIGHT } from "@/core/providers/Form/constants";
import { Trash } from "lucide-react";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { FieldError } from "react-hook-form";

export const ApplicationRow = ({ application, index, removeRow }: ApplicationRowProps) => {
  const theme = useTheme();
  const classes = useStyles();
  const appName = application.metadata.name;

  const {
    register,
    control,
    formState: { errors },
    setValue,
    getValues,
    watch,
  } = useTypedFormContext();

  const {
    props: { CDPipeline },
  } = useCurrentDialog();

  const applicationBranchListWatch = useCodebaseBranchWatchList({
    labels: {
      [codebaseBranchLabels.codebase]: application.metadata.name,
    },
  });

  const sortedApplicationBranchList = React.useMemo(() => {
    return applicationBranchListWatch.dataArray.sort(sortKubeObjectByCreationTimestamp);
  }, [applicationBranchListWatch.dataArray]);

  const rowAppNameField = `${CDPIPELINE_FORM_NAMES.applicationsFieldArray.name}.${index}.appName` as const;
  const rowAppBranchField = `${CDPIPELINE_FORM_NAMES.applicationsFieldArray.name}.${index}.appBranch` as const;

  const applicationsFieldArrayValue = watch(CDPIPELINE_FORM_NAMES.applicationsFieldArray.name);
  const inputDockerStreamsValue = watch(CDPIPELINE_FORM_NAMES.inputDockerStreams.name);

  const handleDeleteApplicationRow = React.useCallback(() => {
    removeRow();

    const applicationsFieldArrayItemByAppName = applicationsFieldArrayValue.find((el) => el.appName === appName);

    const newAppsList = applicationsFieldArrayValue.filter((el) => el.appName !== appName).map((el) => el.appName);

    const newAppsBranchesList = inputDockerStreamsValue.filter(
      (el) => el !== applicationsFieldArrayItemByAppName?.appBranch
    );

    setValue(CDPIPELINE_FORM_NAMES.applicationsToAddChooser.name, newAppsList, {
      shouldDirty: false,
    });

    setValue(CDPIPELINE_FORM_NAMES.applications.name, newAppsList, { shouldDirty: false });

    setValue(CDPIPELINE_FORM_NAMES.applicationsToPromote.name, newAppsList, { shouldDirty: false });

    setValue(CDPIPELINE_FORM_NAMES.inputDockerStreams.name, newAppsBranchesList, {
      shouldDirty: false,
    });
  }, [appName, applicationsFieldArrayValue, inputDockerStreamsValue, removeRow, setValue]);

  const setDefaultValues = React.useCallback(() => {
    if (applicationBranchListWatch.query.isLoading || !applicationBranchListWatch.dataArray?.length) {
      return;
    }

    const availableBranches = sortedApplicationBranchList.map((el) => ({
      specBranchName: el.spec.branchName,
      metadataBranchName: el.metadata.name,
    }));

    let newBranchFieldValue = "";

    if (!CDPipeline) {
      return;
    }

    if (CDPipeline!.spec.applications.includes(appName)) {
      for (const applicationBranch of CDPipeline!.spec.inputDockerStreams) {
        const branchObject = availableBranches.find((el) => el.metadataBranchName === applicationBranch);

        if (!branchObject || !availableBranches.find((el) => el.metadataBranchName === applicationBranch)) {
          continue;
        }

        newBranchFieldValue = branchObject.metadataBranchName;
      }
    } else {
      newBranchFieldValue = availableBranches?.[0].metadataBranchName;
    }

    setValue(rowAppBranchField, newBranchFieldValue);

    setValue(CDPIPELINE_FORM_NAMES.inputDockerStreams.name, [
      ...getValues(CDPIPELINE_FORM_NAMES.inputDockerStreams.name).filter((el: string) => el !== newBranchFieldValue),
      newBranchFieldValue,
    ]);
  }, [
    applicationBranchListWatch.query.isLoading,
    applicationBranchListWatch.dataArray?.length,
    sortedApplicationBranchList,
    CDPipeline,
    appName,
    setValue,
    rowAppBranchField,
    getValues,
  ]);

  React.useEffect(() => {
    setDefaultValues();
  }, [setDefaultValues]);

  const rowAppBranchFieldValue = watch(rowAppBranchField);

  const appBranchError = (
    errors?.[CDPIPELINE_FORM_NAMES.applicationsFieldArray.name as ValueOf<typeof NAMES>] as Record<
      number,
      { appBranch: FieldError }
    >
  )?.[index]?.appBranch;

  return (
    <Grid item xs={12} className={classes.application}>
      <LoadingWrapper isLoading={applicationBranchListWatch.query.isLoading}>
        <Grid container spacing={2}>
          <Grid item xs={5}>
            <FormTextField
              {...register(rowAppNameField)}
              label="Application"
              disabled
              defaultValue={appName}
              control={control}
              errors={errors}
            />
          </Grid>
          <Grid item xs={6}>
            <FormAutocompleteSingle
              placeholder={"Select branch"}
              {...register(rowAppBranchField, {
                required: "Select branch",
                onChange: ({ target: { value } }: FieldEvent) => {
                  const currentInputDockerStreamsValue = getValues(CDPIPELINE_FORM_NAMES.inputDockerStreams.name);

                  const newInputDockerStreamsValue = [
                    ...currentInputDockerStreamsValue.filter((el: string) => el !== rowAppBranchFieldValue),
                    value,
                  ] as string[];
                  setValue(CDPIPELINE_FORM_NAMES.inputDockerStreams.name, newInputDockerStreamsValue);
                },
              })}
              label="Branch"
              control={control}
              errors={{
                [appBranchError?.ref?.name as string]: appBranchError,
              }}
              options={
                sortedApplicationBranchList
                  ? sortedApplicationBranchList.map((el) => ({
                      label: el.spec.branchName,
                      value: el.metadata.name,
                    }))
                  : []
              }
            />
          </Grid>
          <Grid item xs={1} sx={{ mt: theme.typography.pxToRem(FORM_CONTROL_LABEL_HEIGHT) }}>
            <IconButton size={"small"} style={{ minWidth: 0 }} onClick={handleDeleteApplicationRow}>
              <Trash size={20} />
            </IconButton>
          </Grid>
        </Grid>
      </LoadingWrapper>
    </Grid>
  );
};
