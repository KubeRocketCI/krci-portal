import { useNavigate } from "@tanstack/react-router";
import type { ActorDetailTab } from "../../../constants/tabs";
import { routeFactoryActorDetail } from "./route";
import { ActorDetailView } from "./view";

export default function FactoryActorDetailPage() {
  const { atespace, name } = routeFactoryActorDetail.useParams();
  const { tab = "summary" } = routeFactoryActorDetail.useSearch();
  const navigate = useNavigate({ from: routeFactoryActorDetail.fullPath });

  const handleTabChange = (next: ActorDetailTab) => {
    void navigate({ search: (prev) => ({ ...prev, tab: next }) });
  };

  return <ActorDetailView atespace={atespace} name={name} tab={tab} onTabChange={handleTabChange} />;
}
