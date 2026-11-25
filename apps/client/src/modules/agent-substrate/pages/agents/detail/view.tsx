import { Bot } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import type { AgentRead, AgentResult, WorkerPoolRef } from "@my-project/shared";
import { EmptyList } from "@/core/components/EmptyList";
import type { Breadcrumb } from "@/core/components/PageWrapper/types";
import { useClusterStore } from "@/k8s/store";
import { FleetPageView } from "../../../components/FleetPage";
import { PAGE_DESCRIPTION } from "../../../constants/hints";
import { PATH_FACTORY_ACTOR_DETAIL_FULL } from "../../../constants/paths";
import { useAgent } from "../../../hooks/useAgent";
import { useFleet } from "../../../hooks/useFleet";
import { AgentActorCard } from "./components/AgentActorCard";
import { AgentHeader, AgentTitle } from "./components/AgentHeader";
import { AgentProfileCard } from "./components/AgentProfileCard";

export interface AgentDetailViewProps {
  atespace: string;
  name: string;
}

/** The usable worker pools of the actor from the fleet read: getAgent reads no worker. */
function useUsableWorkerPools({ atespace, name }: AgentDetailViewProps): WorkerPoolRef[] | null {
  const { data } = useFleet();
  if (data?.state !== "ready") return null;
  return data.actors.find((row) => row.atespace === atespace && row.name === name)?.usableWorkerPools ?? null;
}

interface AgentResultBodyProps extends AgentDetailViewProps {
  result: AgentResult;
  usableWorkerPools: WorkerPoolRef[] | null;
}

function AgentResultBody({ result, atespace, name, usableWorkerPools }: AgentResultBodyProps) {
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));

  switch (result.kind) {
    case "actorNotFound":
      return (
        <EmptyList customText="Actor not found" description={`Factory has no actor ${name} in atespace ${atespace}.`} />
      );
    case "notAnAgent":
      return (
        <EmptyList
          customText="Not an agent"
          description={`The actor template of actor ${name} names no issue, or it is gone.`}
          linkText="Open the actor"
          route={{ to: PATH_FACTORY_ACTOR_DETAIL_FULL, params: { clusterName, atespace, name } }}
        />
      );
    case "agent":
      return (
        <>
          <AgentHeader agent={result.agent} actor={result.actor} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <AgentProfileCard agent={result.agent} />
            <AgentActorCard actor={result.actor} usableWorkerPools={usableWorkerPools} />
          </div>
        </>
      );
  }
}

/** Title and breadcrumb tail: the issue once the agent is read, the actor name of the route before and on failure. */
export function AgentDetailView({ atespace, name }: AgentDetailViewProps) {
  const query = useAgent({ atespace, name });
  const usableWorkerPools = useUsableWorkerPools({ atespace, name });
  const result = query.data?.state === "ready" ? query.data.result : null;
  const found = result?.kind === "agent" ? result : null;

  const tail: Breadcrumb[] = found
    ? [{ label: found.agent.issue.projectPath }, { label: `#${found.agent.issue.iid}` }]
    : [{ label: name }];

  return (
    <FleetPageView<AgentRead>
      icon={Bot}
      title={found ? <AgentTitle agent={found.agent} actor={found.actor} /> : name}
      description={PAGE_DESCRIPTION.agentDetail}
      breadcrumbs={[{ label: "Agents" }, ...tail]}
      read={query.data}
      error={query.error}
      dataUpdatedAt={query.dataUpdatedAt}
      isFetching={query.isFetching}
      onRefresh={() => void query.refetch()}
    >
      {(read) => (
        <AgentResultBody result={read.result} atespace={atespace} name={name} usableWorkerPools={usableWorkerPools} />
      )}
    </FleetPageView>
  );
}
