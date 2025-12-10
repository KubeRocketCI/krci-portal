import { Tooltip } from "@/core/components/ui/tooltip";
import { CopyButton } from "@/core/components/CopyButton";
import { routeStageDetails } from "@/modules/platform/cdpipelines/pages/stage-details/route";
import {
  useStageWatch,
  usePipelineAppCodebasesWatch,
  useApplicationsWatch,
  createArgoApplicationsByNameMap,
} from "@/modules/platform/cdpipelines/pages/stage-details/hooks";
import React from "react";

export const DeployedVersionHeadColumn = () => {
  const params = routeStageDetails.useParams();
  const stageWatch = useStageWatch();
  const pipelineAppCodebasesWatch = usePipelineAppCodebasesWatch();
  const applicationsWatch = useApplicationsWatch();

  const stage = stageWatch.query.data;

  // Create map for quick lookup
  const argoAppsByName = React.useMemo(
    () => createArgoApplicationsByNameMap(applicationsWatch.data.array),
    [applicationsWatch.data.array]
  );

  const copyVersionsValue = React.useMemo(() => {
    if (
      pipelineAppCodebasesWatch.isLoading ||
      stageWatch.query.isFetching ||
      !stage ||
      !pipelineAppCodebasesWatch.data.length
    ) {
      return "";
    }

    const copyTextVersions = pipelineAppCodebasesWatch.data.reduce((acc, appCodebase) => {
      const name = appCodebase.metadata.name;
      const argoApp = argoAppsByName.get(name);
      const deployedVersion = argoApp?.spec?.source?.targetRevision;

      return acc + `${name}:${deployedVersion}\n`;
    }, "");

    return `flow: ${params.cdPipeline}, env: ${stage.spec.name}, ns: ${stage.spec.namespace}\n\n${copyTextVersions} \n\n`;
  }, [
    params.cdPipeline,
    stage,
    pipelineAppCodebasesWatch.data,
    pipelineAppCodebasesWatch.isLoading,
    stageWatch.query.isFetching,
    argoAppsByName,
  ]);

  return (
    <div className="flex flex-row items-center gap-2">
      Deployed Version
      <Tooltip title="Copy Environment Deployed Versions">
        <div>
          <CopyButton text={copyVersionsValue} size="small" />
        </div>
      </Tooltip>
    </div>
  );
};
