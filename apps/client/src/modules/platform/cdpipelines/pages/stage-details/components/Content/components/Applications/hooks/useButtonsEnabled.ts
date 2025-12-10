import React from "react";
import { useTypedFormContext } from "./useTypedFormContext";
import { IMAGE_TAG_POSTFIX } from "../../../../../constants";
import {
  CODEBASE_COMMON_LANGUAGES,
  CODEBASE_COMMON_FRAMEWORKS,
  CODEBASE_COMMON_BUILD_TOOLS,
} from "@/k8s/api/groups/KRCI/Codebase/configs/mappings";
import { getDeployedVersion, getPipelineRunStatus, pipelineRunReason } from "@my-project/shared";
import { mapEvery } from "@/core/utils/mapEvery";
import { useApplicationCRUD } from "@/k8s/api/groups/ArgoCD/Application";
import {
  usePipelineAppCodebasesWatch,
  useApplicationsWatch,
  usePipelineRunsWatch,
  createArgoApplicationsByNameMap,
} from "../../../../../hooks";

export interface ButtonsMap {
  deploy: boolean;
  uninstall: boolean;
}

export const useButtonsEnabledMap = () => {
  const pipelineAppCodebasesWatch = usePipelineAppCodebasesWatch();
  const applicationsWatch = useApplicationsWatch();
  const pipelineRunsWatch = usePipelineRunsWatch();

  const pipelineAppCodebases = pipelineAppCodebasesWatch.data;

  // Create map for quick lookup
  const argoAppsByName = React.useMemo(
    () => createArgoApplicationsByNameMap(applicationsWatch.data.array),
    [applicationsWatch.data.array]
  );

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
    if (!pipelineAppCodebases.length) {
      return {
        deploy: false,
        uninstall: false,
      };
    }

    const applications = pipelineAppCodebases.map((appCodebase) => appCodebase.metadata.name);

    const selectedImageTagsValues = Object.entries(values).filter(([key, value]) => {
      if (!key.includes(IMAGE_TAG_POSTFIX)) {
        return false;
      }

      const appName = key.split("::")[0];
      return applications.includes(appName) && !!value;
    });

    const allAppVersionsAreSelected = selectedImageTagsValues?.length === pipelineAppCodebases.length;

    const uninstallIsInProgress = applicationDeleteMutation.isPending;

    const map = applications.reduce((acc, appName) => {
      const argoApplication = argoAppsByName.get(appName);

      if (!argoApplication) {
        acc.set(appName, {
          deploy: allAppVersionsAreSelected && !latestDeployPipelineRunIsRunning && !uninstallIsInProgress,
          uninstall: false,
        });
        return acc;
      }

      const isHelm =
        argoApplication?.spec?.lang === CODEBASE_COMMON_LANGUAGES.HELM &&
        argoApplication?.spec?.framework === CODEBASE_COMMON_FRAMEWORKS.HELM &&
        argoApplication?.spec?.buildTool === CODEBASE_COMMON_BUILD_TOOLS.HELM;

      const withValuesOverride = argoApplication ? Object.hasOwn(argoApplication?.spec, "sources") : false;

      const deployedVersion = getDeployedVersion(withValuesOverride, isHelm, argoApplication);

      acc.set(appName, {
        deploy: allAppVersionsAreSelected && !latestDeployPipelineRunIsRunning && !uninstallIsInProgress,
        uninstall: !!deployedVersion && !latestDeployPipelineRunIsRunning,
      });
      return acc;
    }, new Map<string, ButtonsMap>());

    const deployBoolean = mapEvery(map, (value) => value.deploy);

    const uninstallBoolean = mapEvery(map, (value) => value.uninstall);

    return {
      deploy: deployBoolean,
      uninstall: uninstallBoolean,
    };
  }, [
    pipelineAppCodebases,
    argoAppsByName,
    values,
    applicationDeleteMutation.isPending,
    latestDeployPipelineRunIsRunning,
  ]);
};
