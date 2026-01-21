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

export function SecurityPipeline() {
  const { setDialog } = useDialogContext();
  const {
    register,
    control,
    formState: { errors },
    watch,
  } = useTypedFormContext();

  const securityPipelinesWatch = usePipelineWatchList({
    labels: {
      [pipelineLabels.pipelineType]: pipelineType.security,
    },
  });

  const {
    props: {
      pipelines: { security: securityPipeline },
    },
  } = useCurrentDialog();

  const options = securityPipelinesWatch.query.isLoading
    ? [
        {
          label: securityPipeline,
          value: securityPipeline,
        },
      ]
    : mapArrayToSelectOptions(securityPipelinesWatch.data.array.map(({ metadata: { name } }) => name));

  const currentValue = watch(CODEBASE_BRANCH_FORM_NAMES.securityPipeline.name);
  const currentPipeline = securityPipelinesWatch.data.array.find(({ metadata: { name } }) => name === currentValue);

  return (
    <div className="flex items-center gap-2">
      <div className="grow">
        <FormCombobox
          {...register(CODEBASE_BRANCH_FORM_NAMES.securityPipeline.name)}
          placeholder={"Select Security pipeline (optional)"}
          label={"Security pipeline (optional)"}
          control={control}
          errors={errors}
          options={options}
        />
      </div>

      <div className="pt-6">
        <LoadingWrapper isLoading={securityPipelinesWatch.query.isLoading}>
          <Button
            variant="ghost"
            size="icon"
            disabled={!currentPipeline}
            onClick={() => {
              if (!currentPipeline) {
                return;
              }

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
