import React from "react";
import z from "zod";
import { pipelineType, triggerTemplateLabels } from "@my-project/shared";
import { useTriggerTemplateWatchList } from "@/k8s/api/groups/Tekton/TriggerTemplate";
import { useCreateStageForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";

export const DeployTemplate = () => {
  const form = useCreateStageForm();
  const triggerTemplateListWatch = useTriggerTemplateWatchList();
  const triggerTemplateList = triggerTemplateListWatch.data.array;

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

  return (
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
  );
};
