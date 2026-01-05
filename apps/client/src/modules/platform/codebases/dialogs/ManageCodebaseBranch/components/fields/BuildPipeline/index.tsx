import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { usePipelineWatchList } from "@/k8s/api/groups/Tekton/Pipeline";
import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { FormCombobox } from "@/core/providers/Form/components/FormCombobox";
import { mapArrayToSelectOptions } from "@/core/utils/forms/mapToSelectOptions";
import { PipelineGraphDialog } from "@/modules/platform/tekton/dialogs/PipelineGraph";
import { Button } from "@/core/components/ui/button";
import { pipelineLabels, pipelineType } from "@my-project/shared";
import { VectorSquare } from "lucide-react";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { CODEBASE_BRANCH_FORM_NAMES } from "../../../names";
import { useCurrentDialog } from "../../../providers/CurrentDialog/hooks";

export const BuildPipeline = () => {
  const { setDialog } = useDialogContext();

  const {
    register,
    control,
    formState: { errors },
    watch,
  } = useTypedFormContext();

  const buildPipelinesWatch = usePipelineWatchList({
    labels: {
      [pipelineLabels.pipelineType]: pipelineType.build,
    },
  });

  const {
    props: {
      pipelines: { build: buildPipeline },
    },
  } = useCurrentDialog();

  const buildPipelines = buildPipelinesWatch.data.array;

  const options = buildPipelinesWatch.query.isLoading
    ? [
        {
          label: buildPipeline,
          value: buildPipeline,
        },
      ]
    : mapArrayToSelectOptions(buildPipelines.map(({ metadata: { name } }) => name));

  const currentValue = watch(CODEBASE_BRANCH_FORM_NAMES.buildPipeline.name);
  const currentPipeline = buildPipelines.find(({ metadata: { name } }) => name === currentValue);

  return (
    <div className="flex items-center gap-2">
      <div className="grow">
        <FormCombobox
          {...register(CODEBASE_BRANCH_FORM_NAMES.buildPipeline.name, {
            required: "Select Build pipeline",
          })}
          placeholder={"Select Build pipeline"}
          label={"Build pipeline"}
          control={control}
          errors={errors}
          options={options}
        />
      </div>
      <div className="pt-6">
        <LoadingWrapper isLoading={buildPipelinesWatch.query.isLoading}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (!currentPipeline) {
                return;
              }

              setDialog(PipelineGraphDialog, {
                pipeline: currentPipeline,
                pipelineName: currentPipeline?.metadata.name,
              });
            }}
          >
            <VectorSquare size={20} />
          </Button>
        </LoadingWrapper>
      </div>
    </div>
  );
};
