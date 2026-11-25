import { routeFactoryAgentDetail } from "./route";
import { AgentDetailView } from "./view";

export default function FactoryAgentDetailPage() {
  const { atespace, name } = routeFactoryAgentDetail.useParams();

  return <AgentDetailView atespace={atespace} name={name} />;
}
