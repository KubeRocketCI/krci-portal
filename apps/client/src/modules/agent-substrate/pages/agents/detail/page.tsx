import { useNavigate } from "@tanstack/react-router";
import type { AgentDetailViewKind } from "../../../constants/tabs";
import { routeFactoryAgentDetail } from "./route";
import { AgentDetailView } from "./view";

export default function FactoryAgentDetailPage() {
  const { atespace, name } = routeFactoryAgentDetail.useParams();
  const { view = "sections" } = routeFactoryAgentDetail.useSearch();
  const navigate = useNavigate({ from: routeFactoryAgentDetail.fullPath });

  const handleViewChange = (next: AgentDetailViewKind) => {
    void navigate({ search: (prev) => ({ ...prev, view: next }) });
  };

  return <AgentDetailView atespace={atespace} name={name} view={view} onViewChange={handleViewChange} />;
}
