import React from "react";
import { NAMES } from "../../../pages/create/components/CreateCDPipelineWizard/names";
import { Controller, useFormContext } from "react-hook-form";
import { FormTextarea } from "@/core/providers/Form/components/FormTextarea";
import { Applications } from "./Applications";
import { Switch } from "@/core/components/ui/switch";
import { Label } from "@/core/components/ui/label";
import { Info } from "lucide-react";

export const FormContent: React.FC = () => {
  const {
    register,
    control,
    formState: { errors },
    getValues,
    setValue,
  } = useFormContext();

  return (
    <div className="flex flex-col gap-4">
      <FormTextarea
        {...register(NAMES.description, {
          required: "Description is required",
        })}
        label={"Description"}
        tooltipText={"Add a brief description highlighting key features or functionality."}
        placeholder={"Enter description"}
        control={control}
        errors={errors}
        helperText="Help others understand what this deployment flow does."
      />

      {/* Promote Applications Switch */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Label htmlFor="promote-applications" className="text-sm font-medium">
              Promote applications
            </Label>
            <Info className="text-muted-foreground h-4 w-4" />
          </div>
          <p className="text-muted-foreground text-xs">
            Enables the promotion of applications to the higher environment upon the successful pass through all quality
            gates.
          </p>
        </div>
        <Controller
          name={NAMES.ui_applicationsToPromoteAll}
          control={control}
          render={({ field }) => (
            <Switch
              id="promote-applications"
              checked={field.value}
              onCheckedChange={(checked) => {
                field.onChange(checked);
                const values = getValues();
                setValue(NAMES.applicationsToPromote, checked ? values.ui_applicationsToAddChooser : []);
              }}
            />
          )}
        />
      </div>

      <Applications />
    </div>
  );
};
