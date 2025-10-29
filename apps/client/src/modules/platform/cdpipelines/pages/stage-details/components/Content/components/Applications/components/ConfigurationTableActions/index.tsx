import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { ConditionalWrapper } from "@/core/components/ConditionalWrapper";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { usePipelineRunCRUD, usePipelineRunPermissions } from "@/k8s/api/groups/Tekton/PipelineRun";
import { useRequestStatusMessages } from "@/k8s/api/hooks/useResourceRequestStatusMessages";
import {
  IMAGE_TAG_POSTFIX,
  VALUES_OVERRIDE_POSTFIX,
} from "@/modules/platform/cdpipelines/pages/stage-details/constants";
import {
  useCDPipelineWatch,
  useDeployPipelineRunTemplateWatch,
  usePipelineRunsWatch,
  useStageWatch,
  useWatchStageAppCodebasesCombinedData,
} from "@/modules/platform/cdpipelines/pages/stage-details/hooks";
import { Button, Tooltip } from "@mui/material";
import {
  createDeployPipelineRunDraft,
  getPipelineRunStatus,
  k8sOperation,
  pipelineRunReason,
} from "@my-project/shared";
import { Check } from "lucide-react";
import React from "react";
import { useButtonsEnabledMap } from "../../hooks/useButtonsEnabled";
import { useTypedFormContext } from "../../hooks/useTypedFormContext";
import { ConfigurationTableActionsProps } from "./types";
import { usePageUIStore } from "@/modules/platform/cdpipelines/pages/stage-details/store";
import { useShallow } from "zustand/react/shallow";

const parseTagLabelValue = (tag: string) => {
  if (tag.includes("::")) {
    const [label, value] = tag.split("::");
    return { value, label };
  } else {
    return { value: tag, label: undefined };
  }
};

const createApplicationPayload = (imageTag: string, customValues: boolean) => ({
  imageTag,
  customValues,
});

export const ConfigurationTableActions = ({ toggleMode }: ConfigurationTableActionsProps) => {
  const { deployBtnDisabled, setDeployBtnDisabled } = usePageUIStore(
    useShallow((state) => ({
      deployBtnDisabled: state.deployBtnDisabled,
      setDeployBtnDisabled: state.setDeployBtnDisabled,
    }))
  );

  const stageAppCodebasesCombinedDataWatch = useWatchStageAppCodebasesCombinedData();
  const cdPipelineWatch = useCDPipelineWatch();
  const stageWatch = useStageWatch();
  const deployPipelineRunTemplateWatch = useDeployPipelineRunTemplateWatch();
  const pipelineRunsWatch = usePipelineRunsWatch();
  const pipelineRunPermissions = usePipelineRunPermissions();

  const stageAppCodebasesCombinedData = stageAppCodebasesCombinedDataWatch.data?.stageAppCodebasesCombinedData;
  const deployPipelineRunTemplate = deployPipelineRunTemplateWatch.data;

  const cdPipeline = cdPipelineWatch.query.data;
  const stage = stageWatch.query.data;

  const { showRequestErrorMessage } = useRequestStatusMessages();
  const { triggerCreatePipelineRun } = usePipelineRunCRUD();

  const { trigger, reset, getValues, formState } = useTypedFormContext();

  const isDirty = Object.keys(formState.dirtyFields).length > 0;

  const latestDeployPipelineRunIsRunning = React.useMemo(() => {
    const latestNewDeployPipelineRun = pipelineRunsWatch.data?.deploy?.[0];

    if (!latestNewDeployPipelineRun) {
      return false;
    }

    const status = getPipelineRunStatus(latestNewDeployPipelineRun);

    const isRunning = status.reason === pipelineRunReason.running;

    return !latestNewDeployPipelineRun?.status || isRunning;
  }, [pipelineRunsWatch.data?.deploy]);

  const handleClickDeploy = React.useCallback(async () => {
    const valid = await trigger();
    const values = getValues();

    if (
      !valid ||
      stageAppCodebasesCombinedDataWatch.isLoading ||
      !stageAppCodebasesCombinedData ||
      !cdPipeline ||
      !stage
    ) {
      return;
    }

    const appPayload = stageAppCodebasesCombinedData.reduce<
      Record<
        string,
        {
          imageTag: string;
          customValues: boolean;
        }
      >
    >((acc, cur) => {
      const appName = cur.appCodebase.metadata.name;
      const imageTagFieldValue = values[`${appName}${IMAGE_TAG_POSTFIX}`] as string;
      const valuesOverrideFieldValue = values[`${appName}${VALUES_OVERRIDE_POSTFIX}`];

      const { value: tagValue } = parseTagLabelValue(imageTagFieldValue);

      acc[appName] = createApplicationPayload(tagValue, valuesOverrideFieldValue);
      return acc;
    }, {});

    if (!deployPipelineRunTemplate) {
      showRequestErrorMessage(k8sOperation.create, {
        customMessage: {
          message: "Deploy PipelineRun template is not found.",
          options: {
            variant: "error",
          },
        },
      });

      return;
    }

    const newDeployPipelineRun = createDeployPipelineRunDraft({
      cdPipeline,
      stage,
      pipelineRunTemplate: deployPipelineRunTemplate,
      appPayload,
    });

    triggerCreatePipelineRun({
      data: { pipelineRun: newDeployPipelineRun },
      callbacks: {
        onSuccess: () => {
          toggleMode();
          setDeployBtnDisabled(true);

          timer.current = window.setTimeout(() => {
            setDeployBtnDisabled(false);
          }, 10000);
        },
      },
    });
  }, [
    cdPipeline,
    deployPipelineRunTemplate,
    getValues,
    setDeployBtnDisabled,
    showRequestErrorMessage,
    stage,
    stageAppCodebasesCombinedData,
    stageAppCodebasesCombinedDataWatch.isLoading,
    toggleMode,
    trigger,
    triggerCreatePipelineRun,
  ]);

  const timer = React.useRef<number | null>(null);

  const buttonsEnabledMap = useButtonsEnabledMap();

  return (
    <div className="flex flex-row gap-6 items-center justify-end">
      <Tooltip title={"Reset selected image stream versions"}>
        <Button onClick={() => reset()} disabled={!isDirty} sx={{ color: (t) => t.palette.secondary.dark }}>
          undo changes
        </Button>
      </Tooltip>
      <Button
        onClick={() => {
          reset();
          toggleMode();
        }}
        variant="outlined"
      >
        cancel
      </Button>
      <ConditionalWrapper
        condition={pipelineRunPermissions.data?.create.allowed}
        wrapper={(children) => (
          <Tooltip title={"Deploy selected applications with selected image stream version"}>{children}</Tooltip>
        )}
      >
        <ButtonWithPermission
          ButtonProps={{
            startIcon:
              deployBtnDisabled || latestDeployPipelineRunIsRunning ? (
                <LoadingSpinner size={16} />
              ) : (
                <Check size={16} />
              ),
            onClick: handleClickDeploy,
            disabled: deployBtnDisabled || !buttonsEnabledMap.deploy,
            variant: "contained",
            color: "primary",
          }}
          allowed={pipelineRunPermissions.data?.create.allowed}
          reason={pipelineRunPermissions.data?.create.reason}
        >
          Start Deploy
        </ButtonWithPermission>
      </ConditionalWrapper>
    </div>
  );
};
