import { Bot } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { EmptyList } from "@/core/components/EmptyList";
import { useClusterStore } from "@/k8s/store";
import { FleetPage } from "../../../components/FleetPage";
import { PATH_AGENT_ACTORS_FULL } from "../../../constants/paths";
import type { ActorDetailTab } from "../../../constants/tabs";
import { ActorDetail } from "./components/ActorDetail";

export interface ActorDetailViewProps {
  atespace: string;
  name: string;
  tab: ActorDetailTab;
  onTabChange: (tab: ActorDetailTab) => void;
}

export function ActorDetailView({ atespace, name, tab, onTabChange }: ActorDetailViewProps) {
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));

  return (
    <FleetPage
      icon={Bot}
      title={name}
      breadcrumbs={[
        { label: "Actors", route: { to: PATH_AGENT_ACTORS_FULL, params: { clusterName } } },
        { label: atespace },
        { label: name },
      ]}
    >
      {(fleet) => {
        const actor = fleet.actors.find((row) => row.atespace === atespace && row.name === name);
        if (!actor) {
          return (
            <EmptyList
              customText="Actor not found"
              description={`Agent Substrate has no actor ${name} in atespace ${atespace}.`}
            />
          );
        }
        return <ActorDetail actor={actor} tab={tab} onTabChange={onTabChange} />;
      }}
    </FleetPage>
  );
}
