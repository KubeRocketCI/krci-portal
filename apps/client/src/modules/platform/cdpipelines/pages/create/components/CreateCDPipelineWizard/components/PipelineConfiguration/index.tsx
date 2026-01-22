import React from "react";
import { CREATE_CDPIPELINE_FORM_NAMES } from "../../types";
import { cdPipelineDeploymentType } from "@my-project/shared";
import { useCreateCDPipelineFormContext } from "../../providers/form/hooks";

export const PipelineConfiguration: React.FC = () => {
  const form = useCreateCDPipelineFormContext();

  const deploymentTypeOptions = React.useMemo(
    () => [
      { label: "Container", value: cdPipelineDeploymentType.container },
      { label: "Custom", value: cdPipelineDeploymentType.custom },
    ],
    []
  );

  const handlePromoteAllChange = React.useCallback(
    (value: boolean) => {
      const applicationsToAddChooser =
        form.getFieldValue(CREATE_CDPIPELINE_FORM_NAMES.ui_applicationsToAddChooser.name) || [];
      form.setFieldValue(
        CREATE_CDPIPELINE_FORM_NAMES.applicationsToPromote.name,
        value ? applicationsToAddChooser : []
      );
    },
    [form]
  );

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <form.AppField name={CREATE_CDPIPELINE_FORM_NAMES.name.name}>
          {(field) => (
            <field.FormTextField
              label="Pipeline name"
              tooltipText="Enter a unique and descriptive name for your deployment pipeline."
              placeholder="Enter pipeline name"
            />
          )}
        </form.AppField>

        <form.AppField name={CREATE_CDPIPELINE_FORM_NAMES.description.name}>
          {(field) => (
            <field.FormTextarea
              label="Description"
              tooltipText="Add a brief description highlighting key features or functionality."
              placeholder="Enter description"
              helperText="Help others understand what this deployment flow does."
            />
          )}
        </form.AppField>

        <form.AppField name={CREATE_CDPIPELINE_FORM_NAMES.deploymentType.name}>
          {(field) => (
            <field.FormCombobox
              label="Deployment Type"
              tooltipText="Select the deployment type for this pipeline"
              placeholder="Select deployment type"
              options={deploymentTypeOptions}
            />
          )}
        </form.AppField>
      </div>

      {/* Promote Applications Switch */}
      <div className="w-full">
        <form.AppField
          name={CREATE_CDPIPELINE_FORM_NAMES.ui_applicationsToPromoteAll.name}
          listeners={{
            onChange: ({ value }) => handlePromoteAllChange(value as boolean),
          }}
        >
          {(field) => (
            <field.FormSwitch
              rich
              label="Promote applications"
              description="Enables the promotion of applications to the higher environment upon the successful pass through all quality gates."
            />
          )}
        </form.AppField>
      </div>
    </div>
  );
};
