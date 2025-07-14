import React from "react";
import { useTypedFormContext } from "./useTypedFormContext";
import { IMAGE_TAG_POSTFIX } from "../../../../../constants";
import {
  CODEBASE_COMMON_LANGUAGES,
  CODEBASE_COMMON_FRAMEWORKS,
  CODEBASE_COMMON_BUILD_TOOLS,
} from "@/core/k8s/api/groups/KRCI/Codebase/configs/mappings";
import { getDeployedVersion, getPipelineRunStatus, pipelineRunReason } from "@my-project/shared";
import { mapEvery } from "@/core/utils/mapEvery";
import { useApplicationCRUD } from "@/core/k8s/api/groups/ArgoCD/Application";
import { useWatchStageAppCodebasesCombinedData, usePipelineRunsWatch } from "../../../../../hooks";

export interface ButtonsMap {
  deploy: boolean;
  uninstall: boolean;
}

export const useButtonsEnabledMap = () => {
  const stageAppCodebasesCombinedDataWatch = useWatchStageAppCodebasesCombinedData();
  const pipelineRunsWatch = usePipelineRunsWatch();

  const stageAppCodebasesCombinedData = stageAppCodebasesCombinedDataWatch.data?.stageAppCodebasesCombinedData;
  const stageAppCodebasesCombinedDataByApplicationName =
    stageAppCodebasesCombinedDataWatch.data?.stageAppCodebasesCombinedDataByApplicationName;

  const stageAppCodebases = stageAppCodebasesCombinedDataWatch.data?.appCodebaseList;

  const { watch } = useTypedFormContext();

  const values = watch();

  const latestDeployPipelineRunIsRunning = React.useMemo(() => {
    const latestNewDeployPipelineRun = pipelineRunsWatch.data?.deploy?.[0];

    if (!latestNewDeployPipelineRun) {
      return false;
    }

    const status = getPipelineRunStatus(latestNewDeployPipelineRun);

    const isRunning = status.reason === pipelineRunReason.running;

    return !latestNewDeployPipelineRun?.status || isRunning;
  }, [pipelineRunsWatch.data?.deploy]);

  const {
    mutations: { applicationDeleteMutation },
  } = useApplicationCRUD();

  return React.useMemo(() => {
    if (
      !stageAppCodebases ||
      !stageAppCodebases.length ||
      !stageAppCodebasesCombinedDataByApplicationName ||
      !stageAppCodebasesCombinedDataByApplicationName.size
    ) {
      return {
        deploy: false,
        uninstall: false,
      };
    }

    const applications = stageAppCodebases.map((appCodebase) => appCodebase.metadata.name);

    const selectedImageTagsValues = Object.entries(values).filter(([key, value]) => {
      if (!key.includes(IMAGE_TAG_POSTFIX)) {
        return false;
      }

      const appName = key.split("::")[0];
      return applications.includes(appName) && !!value;
    });

    const allAppVersionsAreSelected = selectedImageTagsValues?.length === stageAppCodebasesCombinedData?.length;

    const uninstallIsInProgress = applicationDeleteMutation.isPending;

    const map = applications.reduce((acc, appName) => {
      {
        const application = stageAppCodebasesCombinedDataByApplicationName.get(appName)?.application;
        const argoApplicationBySelectedApplication =
          stageAppCodebasesCombinedDataByApplicationName.get(appName)?.application;

        if (!argoApplicationBySelectedApplication) {
          acc.set(appName, {
            deploy: allAppVersionsAreSelected && !latestDeployPipelineRunIsRunning && !uninstallIsInProgress,
            uninstall: false,
          });
          return acc;
        }

        const isHelm =
          application?.spec?.lang === CODEBASE_COMMON_LANGUAGES.HELM &&
          application?.spec?.framework === CODEBASE_COMMON_FRAMEWORKS.HELM &&
          application?.spec?.buildTool === CODEBASE_COMMON_BUILD_TOOLS.HELM;

        const withValuesOverride = argoApplicationBySelectedApplication
          ? Object.hasOwn(argoApplicationBySelectedApplication?.spec, "sources")
          : false;

        const deployedVersion = getDeployedVersion(withValuesOverride, isHelm, argoApplicationBySelectedApplication);

        acc.set(appName, {
          deploy: allAppVersionsAreSelected && !latestDeployPipelineRunIsRunning && !uninstallIsInProgress,
          uninstall: !!deployedVersion && !latestDeployPipelineRunIsRunning,
        });
        return acc;
      }
    }, new Map<string, ButtonsMap>());

    const deployBoolean = mapEvery(map, (value) => value.deploy);

    const uninstallBoolean = mapEvery(map, (value) => value.uninstall);

    return {
      deploy: deployBoolean,
      uninstall: uninstallBoolean,
    };
  }, [
    stageAppCodebases,
    stageAppCodebasesCombinedDataByApplicationName,
    values,
    stageAppCodebasesCombinedData?.length,
    applicationDeleteMutation.isPending,
    latestDeployPipelineRunIsRunning,
  ]);
};
