import type React from "react";
import { ExternalLink } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import type { ActorAgent, ActorRow, ActorSnapshot, ActorState } from "@my-project/shared";
import { CellExternalLink, CellLink } from "@/core/components/Table/components/CellLink";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { Badge } from "@/core/components/ui/badge";
import { useClusterStore } from "@/k8s/store";
import { PATH_PROJECT_DETAILS_FULL } from "@/modules/platform/codebases/pages/details/route";
import { ACTOR_STATE_VARIANT, SNAPSHOT_DURABLE_STATE_VARIANT } from "../../constants/actorState";
import { PATH_AGENT_ACTOR_DETAIL_FULL } from "../../constants/paths";
import { issueLabel } from "../../utils/issueLabel";
import { EmptyValue } from "../EmptyValue";

/** Actor table rows navigate on click. */
const stopRowClick = (event: React.MouseEvent) => event.stopPropagation();

export function ActorStateBadge({ state }: { state: ActorState }) {
  return <Badge variant={ACTOR_STATE_VARIANT[state]}>{state}</Badge>;
}

export function ActorLink({ actor }: { actor: Pick<ActorRow, "atespace" | "name"> }) {
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));
  return (
    <CellLink
      to={PATH_AGENT_ACTOR_DETAIL_FULL}
      params={{ clusterName, atespace: actor.atespace, name: actor.name }}
      text={actor.name}
      onClick={stopRowClick}
    />
  );
}

export function ActorIssue({ agent }: { agent: ActorAgent | null }) {
  if (!agent) return <EmptyValue />;

  const label = issueLabel(agent.issue);
  if (!agent.issue.url) return <TextWithTooltip text={label} />;

  return <CellExternalLink href={agent.issue.url} text={label} icon={ExternalLink} onClick={stopRowClick} />;
}

export function ActorCodebase({ agent }: { agent: ActorAgent | null }) {
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
  return <Badge variant={SNAPSHOT_DURABLE_STATE_VARIANT[snapshot.durableState]}>{snapshot.durableState}</Badge>;
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
