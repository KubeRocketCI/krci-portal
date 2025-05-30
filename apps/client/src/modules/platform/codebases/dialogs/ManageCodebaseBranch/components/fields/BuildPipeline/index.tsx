import { useDialogContext } from "@/core/providers/Dialog/hooks";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { CODEBASE_BRANCH_FORM_NAMES } from "../../../names";
import { useCurrentDialog } from "../../../providers/CurrentDialog/hooks";
import { FormAutocompleteSingle } from "@/core/providers/Form/components/FormAutocompleteSingle";
import { FORM_CONTROL_LABEL_HEIGHT } from "@/core/providers/Form/constants";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { Stack, IconButton, Box } from "@mui/material";
import { ChartNetwork } from "lucide-react";
import { usePipelineWatchList } from "@/core/k8s/api/groups/Tekton/Pipeline";
import { pipelineType, pipelineLabels } from "@my-project/shared";
import { mapArrayToSelectOptions } from "@/core/utils/forms/mapToSelectOptions";
import { PipelineGraphDialog } from "@/modules/platform/pipelines/dialogs/PipelineGraph";

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

  const buildPipelines = buildPipelinesWatch.dataArray;

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
    <Stack spacing={2} direction="row" alignItems="center">
      <Box flexGrow={1}>
        <FormAutocompleteSingle
          {...register(CODEBASE_BRANCH_FORM_NAMES.buildPipeline.name, {
            required: "Select Build pipeline",
          })}
          placeholder={"Select Build pipeline"}
          label={"Build pipeline"}
          control={control}
          errors={errors}
          options={options}
        />
      </Box>
      <Box sx={{ pt: (t) => t.typography.pxToRem(FORM_CONTROL_LABEL_HEIGHT) }}>
        <LoadingWrapper isLoading={buildPipelinesWatch.query.isLoading}>
          <IconButton
            onClick={() => {
              if (!currentPipeline) {
                return;
              }

              setDialog(PipelineGraphDialog, {
                pipeline: currentPipeline,
                pipelineName: currentPipeline?.metadata.name,
              });
            }}
            size={"small"}
          >
            <ChartNetwork size={20} />
          </IconButton>
        </LoadingWrapper>
      </Box>
    </Stack>
  );
};
