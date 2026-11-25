import type { AgentDetail } from "@my-project/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { KV } from "../../../../../components/KV";
import { agentProfileRows } from "./rows";

const TITLE_ID = "agent-profile-title";

export function AgentProfileCard({ agent }: { agent: AgentDetail }) {
  return (
    <Card role="region" aria-labelledby={TITLE_ID}>
      <CardHeader className="p-4 pb-2">
        <CardTitle id={TITLE_ID} className="text-sm font-semibold">
          Agent profile
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <KV rows={agentProfileRows(agent)} />
      </CardContent>
    </Card>
  );
}
