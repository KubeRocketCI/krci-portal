import { useNavigate } from "@tanstack/react-router";
import type { ActorDetailTab } from "../../../constants/tabs";
import { routeAgentActorDetail } from "./route";
import { ActorDetailView } from "./view";

export default function AgentActorDetailPage() {
  const { atespace, name } = routeAgentActorDetail.useParams();
  const { tab = "summary" } = routeAgentActorDetail.useSearch();
  const navigate = useNavigate({ from: routeAgentActorDetail.fullPath });

  const handleTabChange = (next: ActorDetailTab) => {
    void navigate({ search: (prev) => ({ ...prev, tab: next }) });
  };

  return <ActorDetailView atespace={atespace} name={name} tab={tab} onTabChange={handleTabChange} />;
}
