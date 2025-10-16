import { Grid, IconButton, useTheme } from "@mui/material";
import React from "react";
import { useTypedFormContext } from "../../../../../hooks/useFormContext";
import { CDPIPELINE_FORM_NAMES, NAMES } from "../../../../../names";
import { useCurrentDialog } from "../../../../../providers/CurrentDialog/hooks";
import { useStyles } from "./styles";
import { ApplicationRowProps } from "./types";
import { useCodebaseBranchWatchList } from "@/k8s/api/groups/KRCI/CodebaseBranch/hooks";
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
    if (!applicationBranchListWatch.dataArray) return [];
    return [...applicationBranchListWatch.dataArray].sort(sortKubeObjectByCreationTimestamp);
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

  // Track if we've initialized the default value to prevent re-setting
  const hasInitializedRef = React.useRef(false);

  // Set default value once when branches are loaded
  if (
    !hasInitializedRef.current &&
    !applicationBranchListWatch.query.isLoading &&
    sortedApplicationBranchList.length > 0
  ) {
    const currentBranchValue = getValues(rowAppBranchField);

    // Only set default if no value is set yet
    if (!currentBranchValue) {
      const availableBranches = sortedApplicationBranchList.map((el) => ({
        specBranchName: el.spec.branchName,
        metadataBranchName: el.metadata.name,
      }));

      let newBranchFieldValue = "";

      // If editing existing CDPipeline and it has this app, use the existing branch
      if (CDPipeline && CDPipeline.spec.applications.includes(appName)) {
        for (const applicationBranch of CDPipeline.spec.inputDockerStreams) {
          const branchObject = availableBranches.find((el) => el.metadataBranchName === applicationBranch);
          if (branchObject) {
            newBranchFieldValue = branchObject.metadataBranchName;
            break;
          }
        }
      }

      // Otherwise use first available branch
      if (!newBranchFieldValue && availableBranches.length > 0) {
        newBranchFieldValue = availableBranches[0].metadataBranchName;
      }

      if (newBranchFieldValue) {
        setValue(rowAppBranchField, newBranchFieldValue);

        const currentInputDockerStreams = getValues(CDPIPELINE_FORM_NAMES.inputDockerStreams.name);
        if (!currentInputDockerStreams.includes(newBranchFieldValue)) {
          setValue(CDPIPELINE_FORM_NAMES.inputDockerStreams.name, [...currentInputDockerStreams, newBranchFieldValue]);
        }

        hasInitializedRef.current = true;
      }
    } else {
      // If there's already a value, mark as initialized
      hasInitializedRef.current = true;
    }
  }

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
