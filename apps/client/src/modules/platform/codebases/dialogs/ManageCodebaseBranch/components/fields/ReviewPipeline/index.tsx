import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { usePipelineWatchList } from "@/k8s/api/groups/Tekton/Pipeline";
import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { mapArrayToSelectOptions } from "@/core/utils/forms/mapToSelectOptions";
import { PipelineGraphDialog } from "@/modules/platform/tekton/dialogs/PipelineGraph";
import { Button } from "@/core/components/ui/button";
import { pipelineLabels, pipelineType } from "@my-project/shared";
import { VectorSquare } from "lucide-react";
import { CODEBASE_BRANCH_FORM_NAMES } from "../../../names";
import { useCurrentDialog } from "../../../providers/CurrentDialog/hooks";
import { useCodebaseBranchForm } from "../../../providers/form/hooks";
import { useStore } from "@tanstack/react-form";

export const ReviewPipeline = () => {
  const { setDialog } = useDialogContext();
  const form = useCodebaseBranchForm();

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

  const currentValue = useStore(form.store, (state) => state.values.reviewPipeline);
  const currentPipeline = reviewPipelinesWatch.data.array.find(({ metadata: { name } }) => name === currentValue);

  return (
    <div className="flex items-center gap-2">
      <div className="grow">
        <form.AppField name={CODEBASE_BRANCH_FORM_NAMES.reviewPipeline.name as "reviewPipeline"}>
          {(field) => (
            <field.FormCombobox placeholder="Select Review pipeline" label="Review pipeline" options={options} />
          )}
        </form.AppField>
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
