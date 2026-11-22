import { Bot } from "lucide-react";
import { useParams } from "@tanstack/react-router";
import { FleetPage } from "../../../components/FleetPage";
import { PATH_AGENT_ACTORS_FULL } from "../../../constants/paths";

export default function AgentActorDetailPage() {
  const { clusterName, atespace, name } = useParams({ strict: false }) as {
    clusterName?: string;
    atespace?: string;
    name?: string;
  };

  return (
    <FleetPage
      icon={Bot}
      title={name ?? ""}
      breadcrumbs={[
        { label: "Actors", route: { to: PATH_AGENT_ACTORS_FULL, params: { clusterName: clusterName ?? "" } } },
        { label: atespace ?? "" },
        { label: name ?? "" },
      ]}
    />
  );
}
