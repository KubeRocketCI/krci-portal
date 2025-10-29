import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { FORM_CONTROL_LABEL_HEIGHT } from "@/core/providers/Form/constants";
import { useTheme } from "@mui/material";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { CODEBASE_BRANCH_FORM_NAMES } from "../../../names";

export const DefaultBranchVersion = () => {
  const theme = useTheme();

  const {
    register,
    control,
    formState: { errors },
  } = useTypedFormContext();

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <FormTextField
          {...register(CODEBASE_BRANCH_FORM_NAMES.defaultBranchVersionStart.name, {
            required: "Default branch version",
            pattern: {
              value: /^([0-9]+)\.([0-9]+)\.([0-9]+)?$/,
              message: "Enter valid semantic versioning format",
            },
          })}
          label={"Default branch version"}
          tooltipText={"Enter the necessary branch version for the artifact."}
          placeholder={"0.0.0"}
          control={control}
          errors={errors}
        />
      </div>
      <div style={{ marginTop: theme.typography.pxToRem(FORM_CONTROL_LABEL_HEIGHT) }}>
        <FormTextField
          {...register(CODEBASE_BRANCH_FORM_NAMES.defaultBranchVersionPostfix.name, {
            required: "Default branch version",
          })}
          placeholder={"SNAPSHOT"}
          control={control}
          errors={errors}
        />
      </div>
    </div>
  );
};
