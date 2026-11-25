import { useShallow } from "zustand/react/shallow";
import type { ActorAgent, ActorRow, ActorSnapshot, ActorState } from "@my-project/shared";
import { CellLink } from "@/core/components/Table/components/CellLink";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { Badge } from "@/core/components/ui/badge";
import { useClusterStore } from "@/k8s/store";
import { PATH_PROJECT_DETAILS_FULL } from "@/modules/platform/codebases/pages/details/route";
import { ACTOR_STATE_ICON, SNAPSHOT_DURABLE_STATE_ICON } from "../../constants/actorState";
import { PATH_FACTORY_ACTOR_DETAIL_FULL, PATH_FACTORY_AGENT_DETAIL_FULL } from "../../constants/paths";
import { issueLabel } from "../../utils/issueLabel";
import { stopRowClick } from "../../utils/stopRowClick";
import { EmptyValue } from "../EmptyValue";
import { StateBadge } from "../StateBadge";

export function ActorStateBadge({ state }: { state: ActorState }) {
  return <StateBadge label={state} icon={ACTOR_STATE_ICON[state]} />;
}

export function ActorLink({ actor }: { actor: Pick<ActorRow, "atespace" | "name"> }) {
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));
  return (
    <CellLink
      to={PATH_FACTORY_ACTOR_DETAIL_FULL}
      params={{ clusterName, atespace: actor.atespace, name: actor.name }}
      text={actor.name}
      onClick={stopRowClick}
    />
  );
}

interface AgentLinkProps {
  actor: Pick<ActorRow, "atespace" | "name"> & { agent: Pick<ActorAgent, "issue"> | null };
}

export function AgentLink({ actor }: AgentLinkProps) {
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));
  if (!actor.agent) return <EmptyValue />;

  return (
    <CellLink
      to={PATH_FACTORY_AGENT_DETAIL_FULL}
      params={{ clusterName, atespace: actor.atespace, name: actor.name }}
      text={issueLabel(actor.agent.issue)}
      onClick={stopRowClick}
    />
  );
}

export function AgentCodebaseLink({ agent }: { agent: ActorAgent | null }) {
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));
  if (!agent) return <EmptyValue />;
  if (!agent.codebase) return <TextWithTooltip text={agent.issue.projectPath} />;

  return (
    <CellLink
      to={PATH_PROJECT_DETAILS_FULL}
      params={{ clusterName, namespace: agent.codebase.namespace, name: agent.codebase.name }}
      text={agent.codebase.name}
      onClick={stopRowClick}
    />
  );
}

export function SnapshotFidelityBadge({ snapshot }: { snapshot: ActorSnapshot }) {
  return <Badge variant="outline">{snapshot.fidelity}</Badge>;
}

export function SnapshotDurableStateBadge({ snapshot }: { snapshot: ActorSnapshot }) {
  return <StateBadge label={snapshot.durableState} icon={SNAPSHOT_DURABLE_STATE_ICON[snapshot.durableState]} />;
}

export function SnapshotFidelityDurability({ snapshot }: { snapshot: ActorSnapshot | null }) {
  if (!snapshot) return <EmptyValue />;
  return (
    <span className="inline-flex items-center gap-1">
      <SnapshotFidelityBadge snapshot={snapshot} />
      <SnapshotDurableStateBadge snapshot={snapshot} />
    </span>
  );
}
