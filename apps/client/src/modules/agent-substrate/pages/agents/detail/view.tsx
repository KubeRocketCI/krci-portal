import type React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bot } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import type { AgentRead, AgentResult, WorkerPoolRef } from "@my-project/shared";
import { EmptyList } from "@/core/components/EmptyList";
import type { Breadcrumb } from "@/core/components/PageWrapper/types";
import type { PinTarget } from "@/core/hooks/usePinnedItems";
import { Tabs } from "@/core/providers/Tabs/components/Tabs";
import type { Tab } from "@/core/providers/Tabs/components/Tabs/types";
import { useClusterStore } from "@/k8s/store";
import { FleetPageView } from "../../../components/FleetPage";
import { PAGE_DESCRIPTION } from "../../../constants/hints";
import {
  PATH_FACTORY_ACTOR_DETAIL_FULL,
  PATH_FACTORY_AGENT_DETAIL_FULL,
  PATH_FACTORY_AGENTS_FULL,
} from "../../../constants/paths";
import { agentDetailViewEnum, type AgentDetailViewKind } from "../../../constants/tabs";
import { useAgent } from "../../../hooks/useAgent";
import { agentReviewRunsQueryKey, useAgentReviewRuns } from "../../../hooks/useAgentReviewRuns";
import { useFleet } from "../../../hooks/useFleet";
import { issueLabel } from "../../../utils/issueLabel";
import { AgentActorCard } from "./components/AgentActorCard";
import { AgentDiagram } from "./components/AgentDiagram";
import { AgentEgressPolicyCard } from "./components/AgentEgressPolicyCard";
import { AgentHeader, AgentTitle } from "./components/AgentHeader";
import { AgentProducedBlock, type ReviewRunsRead } from "./components/AgentProducedCard";
import { AgentProfileCard } from "./components/AgentProfileCard";

interface AgentRefProps {
  atespace: string;
  name: string;
}

export interface AgentDetailViewProps extends AgentRefProps {
  view: AgentDetailViewKind;
  onViewChange: (view: AgentDetailViewKind) => void;
}

/** The usable worker pools of the actor from the fleet read: getAgent reads no worker. */
function useUsableWorkerPools({ atespace, name }: AgentRefProps): WorkerPoolRef[] | null {
  const { data } = useFleet();
  if (data?.state !== "ready") return null;
  return data.actors.find((row) => row.atespace === atespace && row.name === name)?.usableWorkerPools ?? null;
}

interface AgentResultBodyProps extends AgentDetailViewProps {
  result: AgentResult;
  usableWorkerPools: WorkerPoolRef[] | null;
}

function AgentResultBody({ result, atespace, name, view, onViewChange, usableWorkerPools }: AgentResultBodyProps) {
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
        <AgentBody
          found={result}
          atespace={atespace}
          name={name}
          view={view}
          onViewChange={onViewChange}
          usableWorkerPools={usableWorkerPools}
        />
      );
  }
}

interface AgentBodyProps extends AgentDetailViewProps {
  found: Extract<AgentResult, { kind: "agent" }>;
  usableWorkerPools: WorkerPoolRef[] | null;
}

/** One getAgentReviewRuns read serves both views. */
function AgentBody({ found, atespace, name, view, onViewChange, usableWorkerPools }: AgentBodyProps) {
  const { agent, actor, egressPolicy } = found;
  const query = useAgentReviewRuns({ atespace, name }, { enabled: agent.codebase !== null });
  const reviewRuns: ReviewRunsRead = {
    mergeRequests: query.data?.mergeRequests,
    history: query.data?.history,
    isLoading: query.isLoading,
    error: query.error,
  };

  return (
    <>
      <AgentHeader agent={agent} actor={actor} />
      <AgentViews view={view} onViewChange={onViewChange}>
        {{
          sections: (
            <div className="flex flex-col gap-6">
              <AgentProducedBlock codebase={agent.codebase} {...reviewRuns} />
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <AgentProfileCard agent={agent} />
                <AgentActorCard actor={actor} usableWorkerPools={usableWorkerPools} />
              </div>
              <AgentEgressPolicyCard egressPolicy={egressPolicy} />
            </div>
          ),
          diagram: (
            <AgentDiagram
              agent={agent}
              actor={actor}
              egressPolicy={egressPolicy}
              usableWorkerPools={usableWorkerPools}
              reviewRuns={reviewRuns}
            />
          ),
        }}
      </AgentViews>
    </>
  );
}

const VIEW_IDS = agentDetailViewEnum.options;

const VIEW_LABEL: Record<AgentDetailViewKind, string> = { sections: "Sections", diagram: "Diagram" };

interface AgentViewsProps extends Pick<AgentDetailViewProps, "view" | "onViewChange"> {
  children: Record<AgentDetailViewKind, React.ReactNode>;
}

/** `Tabs` keeps a visited view mounted: the box selection of the diagram survives a change of view. */
function AgentViews({ view, onViewChange, children }: AgentViewsProps) {
  const tabs: Tab[] = VIEW_IDS.map((id) => ({ id, label: VIEW_LABEL[id], component: children[id] }));
  return (
    <Tabs
      tabs={tabs}
      activeTabIdx={Math.max(0, VIEW_IDS.indexOf(view))}
      handleChangeTab={(_event, index) => onViewChange(VIEW_IDS[index])}
    />
  );
}

/**
 * Title and breadcrumb tail: the issue once the agent is read, the actor name of the route before and on failure. Pin:
 * only once the agent is read.
 */
export function AgentDetailView({ atespace, name, view, onViewChange }: AgentDetailViewProps) {
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
        <AgentResultBody
          result={read.result}
          atespace={atespace}
          name={name}
          view={view}
          onViewChange={onViewChange}
          usableWorkerPools={usableWorkerPools}
        />
      )}
    </FleetPageView>
  );
}
