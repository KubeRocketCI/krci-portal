import { useQueryClient } from "@tanstack/react-query";
import { Bot } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import type { AgentRead, AgentResult, WorkerPoolRef } from "@my-project/shared";
import { EmptyList } from "@/core/components/EmptyList";
import type { Breadcrumb } from "@/core/components/PageWrapper/types";
import type { PinTarget } from "@/core/hooks/usePinnedItems";
import { useClusterStore } from "@/k8s/store";
import { FleetPageView } from "../../../components/FleetPage";
import { PAGE_DESCRIPTION } from "../../../constants/hints";
import {
  PATH_FACTORY_ACTOR_DETAIL_FULL,
  PATH_FACTORY_AGENT_DETAIL_FULL,
  PATH_FACTORY_AGENTS_FULL,
} from "../../../constants/paths";
import { useAgent } from "../../../hooks/useAgent";
import { agentReviewRunsQueryKey } from "../../../hooks/useAgentReviewRuns";
import { useFleet } from "../../../hooks/useFleet";
import { issueLabel } from "../../../utils/issueLabel";
import { AgentActorCard } from "./components/AgentActorCard";
import { AgentEgressPolicyCard } from "./components/AgentEgressPolicyCard";
import { AgentHeader, AgentTitle } from "./components/AgentHeader";
import { AgentProducedCard } from "./components/AgentProducedCard";
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
          <AgentProducedCard atespace={atespace} name={name} codebase={result.agent.codebase} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <AgentProfileCard agent={result.agent} />
            <AgentActorCard actor={result.actor} usableWorkerPools={usableWorkerPools} />
          </div>
          <AgentEgressPolicyCard egressPolicy={result.egressPolicy} />
        </>
      );
  }
}

/**
 * Title and breadcrumb tail: the issue once the agent is read, the actor name of the route before and on failure. Pin:
 * only once the agent is read.
 */
export function AgentDetailView({ atespace, name }: AgentDetailViewProps) {
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));
  const query = useAgent({ atespace, name });
  const queryClient = useQueryClient();
  const usableWorkerPools = useUsableWorkerPools({ atespace, name });
  const result = query.data?.state === "ready" ? query.data.result : null;
  const found = result?.kind === "agent" ? result : null;

  const tail: Breadcrumb[] = found
    ? [{ label: found.agent.issue.projectPath }, { label: `#${found.agent.issue.iid}` }]
    : [{ label: name }];

  const pinConfig: PinTarget | undefined = found
    ? {
        label: issueLabel(found.agent.issue),
        route: { to: PATH_FACTORY_AGENT_DETAIL_FULL, params: { clusterName, atespace, name } },
      }
    : undefined;

  return (
    <FleetPageView<AgentRead>
      icon={Bot}
      title={found ? <AgentTitle agent={found.agent} actor={found.actor} /> : name}
      description={PAGE_DESCRIPTION.agentDetail}
      breadcrumbs={[{ label: "Agents", route: { to: PATH_FACTORY_AGENTS_FULL, params: { clusterName } } }, ...tail]}
      pinConfig={pinConfig}
      read={query.data}
      error={query.error}
      dataUpdatedAt={query.dataUpdatedAt}
      isFetching={query.isFetching}
      onRefresh={() => {
        void query.refetch();
        void queryClient.invalidateQueries({ queryKey: agentReviewRunsQueryKey({ atespace, name }) });
      }}
    >
      {(read) => (
        <AgentResultBody result={read.result} atespace={atespace} name={name} usableWorkerPools={usableWorkerPools} />
      )}
    </FleetPageView>
  );
}
