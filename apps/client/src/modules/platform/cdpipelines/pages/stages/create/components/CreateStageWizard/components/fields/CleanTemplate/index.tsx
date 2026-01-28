import React from "react";
import z from "zod";
import { pipelineType, triggerTemplateLabels } from "@my-project/shared";
import { useTriggerTemplateWatchList } from "@/k8s/api/groups/Tekton/TriggerTemplate";
import { useCreateStageForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";

export const CleanTemplate = () => {
  const form = useCreateStageForm();
  const triggerTemplateListWatch = useTriggerTemplateWatchList();
  const triggerTemplateList = triggerTemplateListWatch.data.array;

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
  );
};
