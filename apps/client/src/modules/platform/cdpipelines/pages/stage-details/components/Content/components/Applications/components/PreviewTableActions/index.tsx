import { Button } from "@/core/components/ui/button";
import {
  usePipelineRunsWatch,
  useStageWatch,
  usePipelineAppCodebasesWatch,
  useApplicationsWatch,
  createArgoApplicationsByNameMap,
} from "@/modules/platform/cdpipelines/pages/stage-details/hooks";
import { routeStageDetails } from "@/modules/platform/cdpipelines/pages/stage-details/route";
import { getPipelineRunStatus, pipelineRunReason } from "@my-project/shared";
import { Copy, CopyCheck } from "lucide-react";
import React from "react";
import { CleanButton } from "./components/CleanButton";
import { ConfigureDeployButton } from "./components/ConfigureDeployButton";
import { PreviewTableActionsProps } from "./types";

export const PreviewTableActions = ({ toggleMode }: PreviewTableActionsProps) => {
  const params = routeStageDetails.useParams();
  const pipelineRunsWatch = usePipelineRunsWatch();
  const stageWatch = useStageWatch();
  const pipelineAppCodebasesWatch = usePipelineAppCodebasesWatch();
  const applicationsWatch = useApplicationsWatch();

  const stage = stageWatch.query.data;

  const argoAppsByName = React.useMemo(
    () => createArgoApplicationsByNameMap(applicationsWatch.data.array),
    [applicationsWatch.data.array]
  );

  const copyText = React.useMemo(() => {
    if (
      pipelineAppCodebasesWatch.isLoading ||
      stageWatch.query.isFetching ||
      !stage ||
      !pipelineAppCodebasesWatch.data.length
    ) {
      return "";
    }

    const appVersions = pipelineAppCodebasesWatch.data.map((appCodebase) => {
      const name = appCodebase.metadata.name;
      const argoApp = argoAppsByName.get(name);
      const deployedVersion = argoApp?.spec?.source?.targetRevision ?? "N/A";

      return `application: ${name}\nversion: ${deployedVersion}`;
    });

    return [
      `deployment: ${params.cdPipeline}`,
      `environment: ${stage.spec.name}`,
      `namespace: ${stage.spec.namespace}`,
      appVersions.join("\n======\n"),
    ].join("\n");
  }, [
    params.cdPipeline,
    stage,
    pipelineAppCodebasesWatch.data,
    pipelineAppCodebasesWatch.isLoading,
    stageWatch.query.isFetching,
    argoAppsByName,
  ]);

  const [isCopied, setIsCopied] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(copyText);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsCopied(true);
    timeoutRef.current = setTimeout(() => setIsCopied(false), 2000);
  };

  const latestCleanPipelineRunIsRunning = React.useMemo(() => {
    const latestNewCleanPipelineRun = pipelineRunsWatch.data?.clean?.[0];

    if (!latestNewCleanPipelineRun) {
      return false;
    }

    const status = getPipelineRunStatus(latestNewCleanPipelineRun);

    const isRunning = status.reason === pipelineRunReason.running;

    return !latestNewCleanPipelineRun?.status || isRunning;
  }, [pipelineRunsWatch.data?.clean]);

  const latestDeployPipelineRunIsRunning = React.useMemo(() => {
    const latestNewDeployPipelineRun = pipelineRunsWatch.data?.deploy?.[0];

    if (!latestNewDeployPipelineRun) {
      return false;
    }

    const status = getPipelineRunStatus(latestNewDeployPipelineRun);

    const isRunning = status.reason === pipelineRunReason.running;

    return !latestNewDeployPipelineRun?.status || isRunning;
  }, [pipelineRunsWatch.data?.deploy]);

  return (
    <div className="flex flex-row items-center justify-between gap-4">
      <div>
        {copyText && (
          <Button variant="outline" onClick={handleCopy} className="gap-1.5">
            {isCopied ? <CopyCheck className="size-4" /> : <Copy className="size-4" />}
            Copy deployment status
          </Button>
        )}
      </div>
      <div className="flex flex-row items-center gap-4">
        <CleanButton
          latestCleanPipelineRunIsRunning={latestCleanPipelineRunIsRunning}
          latestDeployPipelineRunIsRunning={latestDeployPipelineRunIsRunning}
        />
        <ConfigureDeployButton
          latestCleanPipelineRunIsRunning={latestCleanPipelineRunIsRunning}
          latestDeployPipelineRunIsRunning={latestDeployPipelineRunIsRunning}
          toggleMode={toggleMode}
        />
      </div>
    </div>
  );
};
