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

interface SecurityPipelineProps {
  defaultPipeline?: string;
}

export function SecurityPipeline({ defaultPipeline }: SecurityPipelineProps) {
  const { setDialog } = useDialogContext();
  const form = useCreateCodebaseBranchForm();

  const securityPipelinesWatch = usePipelineWatchList({
    labels: {
      [pipelineLabels.pipelineType]: pipelineType.security,
    },
  });

  const options =
    securityPipelinesWatch.query.isLoading && defaultPipeline
      ? [{ label: defaultPipeline, value: defaultPipeline }]
      : mapArrayToSelectOptions(securityPipelinesWatch.data.array.map(({ metadata: { name } }) => name));

  const currentValue = useStore(form.store, (state) => state.values.securityPipeline);
  const currentPipeline = securityPipelinesWatch.data.array.find(({ metadata: { name } }) => name === currentValue);

  return (
    <div className="flex items-center gap-2">
      <div className="grow">
        <form.AppField name={CODEBASE_BRANCH_FORM_NAMES.securityPipeline.name as "securityPipeline"}>
          {(field) => (
            <field.FormCombobox
              placeholder="Select Security pipeline (optional)"
              label="Security pipeline (optional)"
              options={options}
            />
          )}
        </form.AppField>
      </div>
      <div className="pt-6">
        <LoadingWrapper isLoading={securityPipelinesWatch.query.isLoading}>
          <Button
            variant="ghost"
            size="icon"
            disabled={!currentPipeline}
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
}
