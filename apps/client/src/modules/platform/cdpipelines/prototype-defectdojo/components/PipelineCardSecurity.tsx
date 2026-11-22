// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import { useNavigate } from "@tanstack/react-router";
import { PATH_CDPIPELINE_STAGE_DETAILS_FULL } from "../../pages/stage-details/route";
import { usePipelineEnvironmentsScope } from "../hooks/usePipelineEnvironmentsScope";
import { EnvironmentCardCounts } from "./EnvironmentCardCounts";

/** Security counts of one Environment card of the CDPipeline of the route. Opens the Overview tab of the Stage. */
export function PipelineCardSecurity({ stage }: { stage: string }) {
  const navigate = useNavigate();
  const pipeline = usePipelineEnvironmentsScope();

  return (
    <EnvironmentCardCounts
      pipeline={pipeline}
      stage={stage}
      onOpen={() =>
        void navigate({
          to: PATH_CDPIPELINE_STAGE_DETAILS_FULL,
          params: {
            clusterName: pipeline.portalClusterName,
            namespace: pipeline.namespace,
            cdPipeline: pipeline.cdPipeline,
            stage,
          },
          search: { tab: "overview" },
        })
      }
    />
  );
}
