import type { AgentActor, AgentDetail } from "@my-project/shared";
import { InfoColumns } from "@/core/components/InfoColumns";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { Card, CardContent } from "@/core/components/ui/card";
import { ActorStateBadge, AgentCodebaseLink, AgentIssueLink } from "../../../../../components/ActorCells";
import { EmptyValue } from "../../../../../components/EmptyValue";
import { issueLabel } from "../../../../../utils/issueLabel";
import { plural } from "../../../../../utils/plural";

interface AgentHeaderProps {
  agent: AgentDetail;
  actor: AgentActor;
}

export function AgentTitle({ agent, actor }: AgentHeaderProps) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <span className="text-foreground font-semibold">{issueLabel(agent.issue)}</span>
      <ActorStateBadge state={actor.state} />
    </span>
  );
}

export function AgentHeader({ agent, actor }: AgentHeaderProps) {
  return (
    <Card role="region" aria-label="Agent">
      <CardContent className="p-4">
        <InfoColumns
          gridCols={5}
          gridItems={[
            { label: "Issue", content: <AgentIssueLink agent={agent} /> },
            {
              label: "Actor state",
              content: (
                <span className="inline-flex">
                  <ActorStateBadge state={actor.state} />
                </span>
              ),
            },
            {
              label: "Turn limit",
              content:
                agent.turnLimit === null ? (
                  <EmptyValue />
                ) : (
                  <span className="text-sm">{plural(agent.turnLimit, "turn")}</span>
                ),
            },
            {
              label: "Issue branch",
              content: (
                <span className="font-mono text-xs">
                  <TextWithTooltip text={agent.issueBranch} />
                </span>
              ),
            },
            { label: "Codebase", content: <AgentCodebaseLink agent={agent} /> },
          ]}
        />
      </CardContent>
    </Card>
  );
}
