import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { usePipelineWatchItem } from "@/k8s/api/groups/Tekton/Pipeline";
import { useTriggerTemplateWatchList } from "@/k8s/api/groups/Tekton/TriggerTemplate";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { PipelineGraphDialog } from "@/modules/platform/tekton/dialogs/PipelineGraph";
import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import { pipelineType, triggerTemplateLabels } from "@my-project/shared";
import { VectorSquare } from "lucide-react";
import React from "react";
import { useStore } from "@tanstack/react-form";
import { STAGE_FORM_NAMES } from "../../../names";
import { useStageForm } from "../../../providers/form/hooks";

export const CleanTemplate = () => {
  const openPipelineGraphDialog = useDialogOpener(PipelineGraphDialog);
  const form = useStageForm();

  // Subscribe to field value (replaces watch)
  const fieldValue = useStore(form.store, (state) => state.values[STAGE_FORM_NAMES.cleanTemplate.name]);

  const triggerTemplateListWatch = useTriggerTemplateWatchList();

  const triggerTemplateList = triggerTemplateListWatch.data.array;

  const cleanTriggerTemplateList = triggerTemplateList.filter(
    (el) => el.metadata.labels?.[triggerTemplateLabels.pipelineType] === pipelineType.clean
  );

  const options = React.useMemo(() => {
    if (triggerTemplateListWatch.query.isLoading || !cleanTriggerTemplateList.length) {
      return [];
    }
    return cleanTriggerTemplateList.map(({ metadata: { name } }) => ({
      label: name,
      value: name,
    }));
  }, [cleanTriggerTemplateList, triggerTemplateListWatch.query.isLoading]);

  const templateByName = cleanTriggerTemplateList.find((item) => item.metadata.name === fieldValue);

  const pipelineWatch = usePipelineWatchItem({
    name: templateByName?.spec?.resourcetemplates?.[0]?.spec?.pipelineRef?.name,
  });

  const pipeline = pipelineWatch.query.data;

  const pipelineIsLoading = pipelineWatch.query.isLoading;

  const tooltipText = React.useMemo(() => {
    if (pipelineIsLoading) {
      return "Loading pipeline template...";
    }

    if (!pipeline && fieldValue) {
      return "The selected template refers to a non-existent pipeline.";
    }

    if (pipeline && !fieldValue) {
      return "Select pipeline template.";
    }

    if (pipeline && fieldValue) {
      return "View pipeline diagram.";
    }

    return "Select pipeline template.";
  }, [pipelineIsLoading, pipeline, fieldValue]);

  return (
    <form.AppField
      name={STAGE_FORM_NAMES.cleanTemplate.name}
      validators={{
        onChange: ({ value }) => {
          if (!value) return "Select Clean Pipeline template";
          return undefined;
        },
      }}
    >
      {(field) => (
        <field.FormSelect
          label="Clean Pipeline template"
          tooltipText="Choose a blueprint pipeline for environment cleanup."
          options={options}
          suffix={
            <LoadingWrapper isLoading={pipelineIsLoading} iconProps={{ size: 16 }}>
              <Tooltip title={tooltipText}>
                <div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (!pipeline) {
                        return;
                      }

                      openPipelineGraphDialog({
                        pipelineName: fieldValue,
                      });
                    }}
                    disabled={!fieldValue || !pipeline}
                    className="h-full rounded-tl-none rounded-bl-none"
                  >
                    <VectorSquare size={16} />
                  </Button>
                </div>
              </Tooltip>
            </LoadingWrapper>
          }
        />
      )}
    </form.AppField>
  );
};
