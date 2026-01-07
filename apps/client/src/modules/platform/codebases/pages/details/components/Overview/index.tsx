import { InfoColumns } from "@/core/components/InfoColumns";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { Card } from "@/core/components/ui/card";
import { useCodebaseWatch } from "../../hooks/data";
import { routeComponentDetails } from "../../route";
import { SonarQubeMetricsWidget } from "@/modules/platform/security/components/sonarqube/SonarQubeMetricsWidget";
import { DependencyTrackMetricsWidget } from "@/modules/platform/security/components/dependencytrack/DependencyTrackMetricsWidget";
import { useInfoRows } from "./hooks/useInfoRows";

export const Overview = () => {
  const codebaseWatch = useCodebaseWatch();
  const gridItems = useInfoRows();

  const params = routeComponentDetails.useParams();

  // Get default branch from codebase spec, fallback to "main"
  const codebase = codebaseWatch.query.data;
  const defaultBranch = codebase?.spec?.defaultBranch || "main";

  return (
    <div className="flex flex-col gap-3">
      <Card className="p-6">
        <h3 className="text-foreground mb-4 text-xl font-semibold">Component Details</h3>
        <LoadingWrapper isLoading={codebaseWatch.isLoading}>
          <InfoColumns gridItems={gridItems} gridCols={4} />
        </LoadingWrapper>
      </Card>
      <SonarQubeMetricsWidget componentKey={params.name} />
      <DependencyTrackMetricsWidget projectName={params.name} defaultBranch={defaultBranch} />
    </div>
  );
};
