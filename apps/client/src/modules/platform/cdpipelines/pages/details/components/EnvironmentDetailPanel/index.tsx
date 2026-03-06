import { Stage } from "@my-project/shared";
import { Header, InfrastructureSection, ApplicationsSection, Footer } from "./components";

interface EnvironmentDetailPanelProps {
  stage: Stage;
}

export function EnvironmentDetailPanel({ stage }: EnvironmentDetailPanelProps) {
  return (
    <div
      className="border-primary/30 bg-card overflow-hidden rounded-2xl border shadow-md"
      data-tour="deployment-detail-panel"
    >
      {/* Panel header */}
      <Header stage={stage} />

      {/* Main content grid */}
      <div className="border-border grid grid-cols-1 divide-y lg:grid-cols-3 lg:divide-x lg:divide-y-0">
        {/* Infrastructure */}
        <InfrastructureSection stage={stage} />

        {/* Applications */}
        <ApplicationsSection stage={stage} />
      </div>

      {/* Panel footer */}
      <Footer stage={stage} />
    </div>
  );
}
