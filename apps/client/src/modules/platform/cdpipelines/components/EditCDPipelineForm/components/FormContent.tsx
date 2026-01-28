import React from "react";
import { EDIT_CDPIPELINE_FORM_NAMES } from "../constants";
import { Applications } from "./Applications";
import { Switch } from "@/core/components/ui/switch";
import { Label } from "@/core/components/ui/label";
import { Info } from "lucide-react";
import { useEditCDPipelineForm } from "../providers/form/hooks";

export const FormContent: React.FC = () => {
  const form = useEditCDPipelineForm();

  return (
    <div className="flex flex-col gap-4">
      <form.AppField
        name={EDIT_CDPIPELINE_FORM_NAMES.description}
        validators={{
          onChange: ({ value }) => (!value ? "Description is required" : undefined),
        }}
      >
        {(field) => (
          <field.FormTextarea
            label="Description"
            tooltipText="Add a brief description highlighting key features or functionality."
            placeholder="Enter description"
            helperText="Help others understand what this deployment flow does."
          />
        )}
      </form.AppField>

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
        <form.AppField name={EDIT_CDPIPELINE_FORM_NAMES.ui_applicationsToPromoteAll}>
          {(field) => (
            <Switch
              id="promote-applications"
              checked={field.state.value}
              onCheckedChange={(checked) => {
                field.handleChange(checked);
                const values = form.store.state.values;
                form.setFieldValue(
                  EDIT_CDPIPELINE_FORM_NAMES.applicationsToPromote,
                  checked ? values.ui_applicationsToAddChooser : []
                );
              }}
            />
          )}
        </form.AppField>
      </div>

      <Applications />
    </div>
  );
};
