import type { AgentActor, AgentDetail } from "@my-project/shared";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { ActorStateBadge, AgentCodebaseLink } from "../../../../../components/ActorCells";
import { EmptyValue } from "../../../../../components/EmptyValue";
import type { KVRow } from "../../../../../components/KV";
import { plural } from "../../../../../utils/plural";
import { IssueLink } from "./IssueLink";

export interface AgentHeaderFacts {
  issue: KVRow;
  actorState: KVRow;
  turnLimit: KVRow;
  issueBranch: KVRow;
  codebase: KVRow;
}

/** The facts of the header; the diagram inspector shows them too. */
export function agentHeaderFacts({ agent, actor }: { agent: AgentDetail; actor: AgentActor }): AgentHeaderFacts {
  return {
    issue: ["Issue", <IssueLink issue={agent.issue} />],
    actorState: [
      "Actor state",
      <span className="inline-flex">
        <ActorStateBadge state={actor.state} />
      </span>,
    ],
    turnLimit: [
      "Turn limit",
      agent.turnLimit === null ? <EmptyValue /> : <span className="text-sm">{plural(agent.turnLimit, "turn")}</span>,
    ],
    issueBranch: [
      "Issue branch",
      <span className="font-mono text-xs">
        <TextWithTooltip text={agent.issueBranch} />
      </span>,
    ],
    codebase: ["Codebase", <AgentCodebaseLink agent={agent} />],
  };
}
