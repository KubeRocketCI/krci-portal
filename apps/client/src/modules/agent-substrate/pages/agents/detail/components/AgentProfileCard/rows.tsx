import type { AgentDetail } from "@my-project/shared";
import type { KVRow } from "../../../../../components/KV";
import { TERM_HINT } from "../../../../../constants/hints";

export function agentProfileRows(agent: AgentDetail): KVRow[] {
  return [
    ["Agent profile", agent.agentProfile, TERM_HINT.agentProfile],
    ["Agent model", agent.model],
    [
      "Agent image",
      agent.agentImage && <span className="font-mono text-xs">{agent.agentImage}</span>,
      TERM_HINT.agentImage,
    ],
  ];
}
