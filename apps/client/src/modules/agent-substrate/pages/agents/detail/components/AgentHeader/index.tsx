import type { AgentActor, AgentDetail } from "@my-project/shared";
import { InfoColumns } from "@/core/components/InfoColumns";
import { Card, CardContent } from "@/core/components/ui/card";
import { ActorStateBadge } from "../../../../../components/ActorCells";
import { issueLabel } from "../../../../../utils/issueLabel";
import { agentHeaderFacts } from "./facts";

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
  const facts = agentHeaderFacts({ agent, actor });
  return (
    <Card role="region" aria-label="Agent">
      <CardContent className="p-4">
        <InfoColumns
          gridCols={5}
          gridItems={[facts.issue, facts.actorState, facts.turnLimit, facts.issueBranch, facts.codebase].map(
            ([label, content]) => ({ label, content })
          )}
        />
      </CardContent>
    </Card>
  );
}
