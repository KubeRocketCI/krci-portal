// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import { routeProjectDetails } from "../../../route";
import { useCodebaseFindingsScope } from "../hooks/useCodebaseFindingsScope";
import { CodebaseSecurityLine } from "./CodebaseSecurityLine";

/** The security line of the codebase of the route, for the Overview tab. */
export function PrototypeCodebaseSecurityLine() {
  const params = routeProjectDetails.useParams();
  const { scope, isLoading } = useCodebaseFindingsScope();

  if (isLoading) {
    // Same height as the line: the tab does not jump when the line arrives.
    return <div className="bg-card h-10 rounded-lg border shadow-sm" aria-hidden />;
  }

  return <CodebaseSecurityLine scope={scope} portalClusterName={params.clusterName} />;
}
