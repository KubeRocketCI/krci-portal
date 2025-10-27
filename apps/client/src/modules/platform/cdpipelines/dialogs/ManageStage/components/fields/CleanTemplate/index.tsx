import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { usePipelineWatchItem } from "@/k8s/api/groups/Tekton/Pipeline";
import { useTriggerTemplateWatchList } from "@/k8s/api/groups/Tekton/TriggerTemplate";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import { FormSelect } from "@/core/providers/Form/components/FormSelect";
import { PipelineGraphDialog } from "@/modules/platform/pipelines/dialogs/PipelineGraph";
import { IconButton, Tooltip } from "@mui/material";
import { pipelineType, triggerTemplateLabels } from "@my-project/shared";
import { VectorSquare } from "lucide-react";
import React from "react";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { STAGE_FORM_NAMES } from "../../../names";

export const CleanTemplate = () => {
  const openPipelineGraphDialog = useDialogOpener(PipelineGraphDialog);

  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useTypedFormContext();

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

  const fieldValue = watch(STAGE_FORM_NAMES.cleanTemplate.name);

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
    <FormSelect
      {...register(STAGE_FORM_NAMES.cleanTemplate.name, {
        required: "Select Clean Pipeline template",
      })}
      label={"Clean Pipeline template"}
      tooltipText="Choose a blueprint pipeline for environment cleanup."
      control={control}
      errors={errors}
      options={options}
      endAdornment={
        <LoadingWrapper isLoading={pipelineIsLoading} iconProps={{ size: 16 }}>
          <Tooltip title={tooltipText}>
            <div>
              <IconButton
                onClick={() => {
                  if (!pipeline) {
                    return;
                  }

                  openPipelineGraphDialog({
                    pipelineName: fieldValue,
                  });
                }}
                disabled={!fieldValue || !pipeline}
                size={"small"}
              >
                <VectorSquare size={16} />
              </IconButton>
            </div>
          </Tooltip>
        </LoadingWrapper>
      }
    />
  );
};
