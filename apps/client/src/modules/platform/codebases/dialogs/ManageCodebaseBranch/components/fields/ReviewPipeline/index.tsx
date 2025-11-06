import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { usePipelineWatchList } from "@/k8s/api/groups/Tekton/Pipeline";
import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { FormCombobox } from "@/core/providers/Form/components/FormCombobox";
import { mapArrayToSelectOptions } from "@/core/utils/forms/mapToSelectOptions";
import { PipelineGraphDialog } from "@/modules/platform/pipelines/dialogs/PipelineGraph";
import { Button } from "@/core/components/ui/button";
import { pipelineLabels, pipelineType } from "@my-project/shared";
import { VectorSquare } from "lucide-react";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { CODEBASE_BRANCH_FORM_NAMES } from "../../../names";
import { useCurrentDialog } from "../../../providers/CurrentDialog/hooks";

export const ReviewPipeline = () => {
  const { setDialog } = useDialogContext();
  const {
    register,
    control,
    formState: { errors },
    watch,
  } = useTypedFormContext();

  const reviewPipelinesWatch = usePipelineWatchList({
    labels: {
      [pipelineLabels.pipelineType]: pipelineType.review,
    },
  });

  const {
    props: {
      pipelines: { review: reviewPipeline },
    },
  } = useCurrentDialog();

  const options = reviewPipelinesWatch.query.isLoading
    ? [
        {
          label: reviewPipeline,
          value: reviewPipeline,
        },
      ]
    : mapArrayToSelectOptions(reviewPipelinesWatch.data.array.map(({ metadata: { name } }) => name));

  const currentValue = watch(CODEBASE_BRANCH_FORM_NAMES.reviewPipeline.name);
  const currentPipeline = reviewPipelinesWatch.data.array.find(({ metadata: { name } }) => name === currentValue);

  return (
    <div className="flex items-center gap-2">
      <div className="grow">
        <FormCombobox
          {...register(CODEBASE_BRANCH_FORM_NAMES.reviewPipeline.name, {
            required: "Select Review pipeline",
          })}
          placeholder={"Select Review pipeline"}
          label={"Review pipeline"}
          control={control}
          errors={errors}
          options={options}
        />
      </div>

      <div className="pt-6">
        <LoadingWrapper isLoading={reviewPipelinesWatch.query.isLoading}>
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
