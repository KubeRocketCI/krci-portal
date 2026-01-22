import React from "react";
import { useCreateStageForm } from "../../providers/form/hooks";
import { NAMES } from "../../names";
import z from "zod";
import { useTriggerTemplateWatchList } from "@/k8s/api/groups/Tekton/TriggerTemplate";
import { pipelineType, stageTriggerType, triggerTemplateLabels } from "@my-project/shared";

export const PipelineConfiguration: React.FC = () => {
  const form = useCreateStageForm();
  const triggerTemplateListWatch = useTriggerTemplateWatchList();
  const triggerTemplateList = triggerTemplateListWatch.data.array;

  const triggerTypeOptions = React.useMemo(
    () => [
      {
        label: stageTriggerType.Auto,
        value: stageTriggerType.Auto,
        description: "Automatically trigger deployment when changes are detected",
      },
      {
        label: stageTriggerType.Manual,
        value: stageTriggerType.Manual,
        description: "Require manual approval before deployment",
      },
    ],
    []
  );

  const deployTemplateOptions = React.useMemo(
    () =>
      triggerTemplateList
        .filter((el) => el.metadata.labels?.[triggerTemplateLabels.pipelineType] === pipelineType.deploy)
        .map((el) => ({
          label: el.metadata.name,
          value: el.metadata.name,
        })),
    [triggerTemplateList]
  );

  const cleanTemplateOptions = React.useMemo(
    () =>
      triggerTemplateList
        .filter((el) => el.metadata.labels?.[triggerTemplateLabels.pipelineType] === pipelineType.clean)
        .map((el) => ({
          label: el.metadata.name,
          value: el.metadata.name,
        })),
    [triggerTemplateList]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-foreground mb-2 text-lg font-semibold">Pipeline Configuration</h2>
        <p className="text-muted-foreground text-sm">
          Configure the pipeline settings including trigger type and pipeline templates for deployment and cleanup.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <form.AppField
            name={NAMES.triggerType}
            validators={{
              onChange: z.string().min(1, "Select trigger type"),
            }}
            children={(field) => (
              <field.FormRadioGroup
                label="Trigger Type"
                options={triggerTypeOptions}
                variant="tile"
                className="grid-cols-2"
              />
            )}
          />
        </div>
        <div />
        <div>
          <form.AppField
            name={NAMES.triggerTemplate}
            validators={{
              onChange: z.string().min(1, "Select Deploy Pipeline template"),
            }}
            children={(field) => (
              <field.FormSelect
                label="Deploy Pipeline Template"
                placeholder="Select deploy template"
                options={deployTemplateOptions}
                disabled={triggerTemplateListWatch.query.isLoading}
              />
            )}
          />
        </div>
        <div>
          <form.AppField
            name={NAMES.cleanTemplate}
            validators={{
              onChange: z.string().min(1, "Select Clean Pipeline template"),
            }}
            children={(field) => (
              <field.FormSelect
                label="Clean Pipeline Template"
                placeholder="Select clean template"
                options={cleanTemplateOptions}
                disabled={triggerTemplateListWatch.query.isLoading}
              />
            )}
          />
        </div>
      </div>
    </div>
  );
};
