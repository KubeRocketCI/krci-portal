import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { usePipelineWatchList } from "@/k8s/api/groups/Tekton/Pipeline";
import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { mapArrayToSelectOptions } from "@/core/utils/forms/mapToSelectOptions";
import { PipelineGraphDialog } from "@/modules/platform/tekton/dialogs/PipelineGraph";
import { Button } from "@/core/components/ui/button";
import { pipelineLabels, pipelineType } from "@my-project/shared";
import { VectorSquare } from "lucide-react";
import { CODEBASE_BRANCH_FORM_NAMES } from "../../../constants";
import { useCreateCodebaseBranchForm } from "../../../providers/form/hooks";
import { useStore } from "@tanstack/react-form";

interface BuildPipelineProps {
  defaultPipeline?: string;
}

export const BuildPipeline = ({ defaultPipeline }: BuildPipelineProps) => {
  const { setDialog } = useDialogContext();
  const form = useCreateCodebaseBranchForm();

  const buildPipelinesWatch = usePipelineWatchList({
    labels: {
      [pipelineLabels.pipelineType]: pipelineType.build,
    },
  });

  const buildPipelines = buildPipelinesWatch.data.array;

  const options =
    buildPipelinesWatch.query.isLoading && defaultPipeline
      ? [{ label: defaultPipeline, value: defaultPipeline }]
      : mapArrayToSelectOptions(buildPipelines.map(({ metadata: { name } }) => name));

  const currentValue = useStore(form.store, (state) => state.values.buildPipeline);
  const currentPipeline = buildPipelines.find(({ metadata: { name } }) => name === currentValue);

  return (
    <div className="flex items-center gap-2">
      <div className="grow">
        <form.AppField name={CODEBASE_BRANCH_FORM_NAMES.buildPipeline.name as "buildPipeline"}>
          {(field) => (
            <field.FormCombobox placeholder="Select Build pipeline" label="Build pipeline" options={options} />
          )}
        </form.AppField>
      </div>
      <div className="pt-6">
        <LoadingWrapper isLoading={buildPipelinesWatch.query.isLoading}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (!currentPipeline) return;
              setDialog(PipelineGraphDialog, {
                pipeline: currentPipeline,
                pipelineName: currentPipeline.metadata.name,
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
