// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import { routeStageDetails } from "../../pages/stage-details/route";
import { useStageEnvironmentScope } from "../hooks/useStageEnvironmentScope";
import { EnvironmentSecuritySummary } from "./EnvironmentSecuritySummary";

/** The security summary of the Stage of the route, for the Stage Overview tab. */
export function StageSecuritySummary() {
  const params = routeStageDetails.useParams();
  const { pipeline } = useStageEnvironmentScope();

  if (!pipeline) {
    return null;
  }

  return <EnvironmentSecuritySummary pipeline={pipeline} stage={params.stage} />;
}
