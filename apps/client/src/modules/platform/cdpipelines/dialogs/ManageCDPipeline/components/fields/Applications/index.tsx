import { Tooltip } from "@mui/material";
import React from "react";
import { useFieldArray } from "react-hook-form";
import { useCurrentDialog } from "../../../providers/CurrentDialog/hooks";
import { ApplicationRow } from "./components/ApplicationRow";
import { CDPIPELINE_FORM_NAMES } from "../../../names";
import { FormAutocompleteMulti } from "@/core/providers/Form/components/FormAutocomplete";
import { FieldEvent } from "@/core/types/forms";
import { FormControlLabelWithTooltip } from "@/core/providers/Form/components/FormControlLabelWithTooltip";
import { FormSwitch } from "@/core/providers/Form/components/FormSwitch";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { Info } from "lucide-react";

export const Applications = () => {
  const {
    extra: { applications },
  } = useCurrentDialog();

  const {
    register,
    formState: { errors },
    control,
    watch,
    getValues,
    setValue,
  } = useTypedFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name: CDPIPELINE_FORM_NAMES.applicationsFieldArray.name,
    rules: {
      minLength: {
        value: 1,
        message: "At least one application is required.",
      },
    },
  });

  const applicationsOptions = React.useMemo(
    () =>
      (applications || []).map((app) => ({
        label: app.metadata.name,
        value: app.metadata.name,
      })),
    [applications]
  );

  const currentAppFieldArrayValue = watch(CDPIPELINE_FORM_NAMES.applicationsFieldArray.name);

  const handleApplicationChanges = (newApplications: string[]) => {
    const prevAppNames = currentAppFieldArrayValue?.map((app) => app.appName);
    const addedApplications = newApplications.filter((app) => !prevAppNames.includes(app));

    addedApplications.forEach((app) => {
      append({ appName: app, appBranch: "", appToPromote: false });
    });

    const removedApplications = currentAppFieldArrayValue
      .map((app, index) => ({ ...app, index }))
      .filter((app) => !newApplications.includes(app.appName));

    const removedApplicationsBranchesNames = removedApplications.map((app) => app.appBranch);

    const newInputDockerStreamsValue = getValues(CDPIPELINE_FORM_NAMES.inputDockerStreams.name).filter(
      (stream: string) => !removedApplicationsBranchesNames.includes(stream)
    );

    setValue(CDPIPELINE_FORM_NAMES.inputDockerStreams.name, newInputDockerStreamsValue);

    const removedApplicationIndices = removedApplications.map((app) => app.index);

    setValue(CDPIPELINE_FORM_NAMES.applications.name, newApplications, { shouldDirty: false });

    const applicationsToPromoteAllFieldValue = getValues(CDPIPELINE_FORM_NAMES.applicationsToPromoteAll.name);

    setValue(
      CDPIPELINE_FORM_NAMES.applicationsToPromote.name,
      applicationsToPromoteAllFieldValue ? newApplications : [],
      {
        shouldDirty: false,
      }
    );

    removedApplicationIndices.reverse().forEach((index) => {
      remove(index);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <FormAutocompleteMulti
        {...register(CDPIPELINE_FORM_NAMES.applicationsToAddChooser.name, {
          onChange: ({ target: { value } }: FieldEvent<string[]>) => handleApplicationChanges(value),
          validate: (value: string[]) => {
            if (value.length < 1) {
              return "At least one application is required.";
            }
            return true;
          },
        })}
        options={applicationsOptions}
        control={control}
        errors={errors}
        label="Applications"
        placeholder={"Select applications"}
        tooltipText={"Select the applications linked to this Deployment Flow."}
      />
      <div>
        <div className="grid grid-cols-12 gap-2">
          {!!fields && !!fields.length ? (
            <>
              <div className="col-span-5">
                <span>Application</span>
              </div>
              <div className="col-span-6">
                <div className="flex gap-2 items-center">
                  <div>Branch</div>
                  <div>
                    <Tooltip title={"Specify the branch of the selected applications for deployment."}>
                      <Info size={16} />
                    </Tooltip>
                  </div>
                </div>
              </div>
              <div className="col-span-1">
                <span>Delete</span>
              </div>
            </>
          ) : null}
          {fields.map((field, index) => {
            const application = applications!.find((el) => el.metadata.name === field.appName);

            if (!application) {
              return null;
            }

            return (
              <ApplicationRow application={application!} removeRow={() => remove(index)} index={index} key={field.id} />
            );
          })}
        </div>
      </div>
      <div>
        <div className="flex flex-col gap-0 items-start">
          <FormControlLabelWithTooltip
            label="Promote applications"
            title="Enables the promotion of applications to the higher environment upon the successful pass through all quality gates."
          />
          <FormSwitch
            label={<></>}
            labelPlacement="start"
            {...register(CDPIPELINE_FORM_NAMES.applicationsToPromoteAll.name, {
              onChange: ({ target: { value } }: FieldEvent) => {
                const values = getValues();

                setValue(
                  CDPIPELINE_FORM_NAMES.applicationsToPromote.name,
                  value ? values.applicationsToAddChooser : []
                );
              },
            })}
            control={control}
            errors={errors}
          />
        </div>
      </div>
    </div>
  );
};
