import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { usePipelineWatchItem } from "@/k8s/api/groups/Tekton/Pipeline";
import { useTriggerTemplateWatchList } from "@/k8s/api/groups/Tekton/TriggerTemplate";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { FormSelect } from "@/core/providers/Form/components/FormSelect";
import { PipelineGraphDialog } from "@/modules/platform/tekton/dialogs/PipelineGraph";
import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import { pipelineType, triggerTemplateLabels } from "@my-project/shared";
import { VectorSquare } from "lucide-react";
import React from "react";
import { useFormContext } from "react-hook-form";
import { NAMES } from "../../../pages/stages/create/components/CreateStageWizard/names";

export const DeployTemplateField: React.FC = () => {
  const openPipelineGraphDialog = useDialogOpener(PipelineGraphDialog);
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext();

  const triggerTemplateListWatch = useTriggerTemplateWatchList();

  const triggerTemplateList = triggerTemplateListWatch.data.array;

  const deployTriggerTemplateList = triggerTemplateList.filter(
    (el) => el.metadata.labels?.[triggerTemplateLabels.pipelineType] === pipelineType.deploy
  );

  const options = React.useMemo(() => {
    if (triggerTemplateListWatch.query.isLoading || !deployTriggerTemplateList.length) {
      return [];
    }
    return deployTriggerTemplateList.map(({ metadata: { name } }) => ({
      label: name,
      value: name,
    }));
  }, [deployTriggerTemplateList, triggerTemplateListWatch.query.isLoading]);

  const fieldValue = watch(NAMES.triggerTemplate);

  const templateByName = deployTriggerTemplateList.find((item) => item.metadata.name === fieldValue);

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
    <FormSelect
      {...register(NAMES.triggerTemplate, {
        required: "Select Deploy Pipeline template",
      })}
      label={"Deploy Pipeline template"}
      tooltipText="Choose a predefined blueprint outlining the deployment process for your application(s)."
      control={control}
      errors={errors}
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
  );
};
