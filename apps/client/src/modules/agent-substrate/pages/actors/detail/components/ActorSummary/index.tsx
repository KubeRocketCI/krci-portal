import type { ActorRow } from "@my-project/shared";
import { Alert } from "@/core/components/ui/alert";
import { Card, CardContent } from "@/core/components/ui/card";
import { formatTimestamp } from "@/core/utils/date-humanize";
import { ActorStateBadge, AgentCodebaseLink, AgentIssueLink } from "../../../../../components/ActorCells";
import { KV } from "../../../../../components/KV";
import { TERM_HINT } from "../../../../../constants/hints";
import { sizeText, workerPoolsText, workerSelectorText } from "../../../../../utils/roomLabel";

export function ActorSummary({ actor }: { actor: ActorRow }) {
  return (
    <div className="flex flex-col gap-4">
      {actor.crash && (
        <Alert variant="destructive" title="Actor crashed">
          <p className="break-all">{actor.crash.message}</p>
          {actor.crash.at && <p className="text-xs">Crashed at {formatTimestamp(actor.crash.at)}</p>}
        </Alert>
      )}
      <Card>
        <CardContent className="p-4">
          <KV
            rows={[
              ["Issue", <AgentIssueLink agent={actor.agent} />],
              ["Codebase", <AgentCodebaseLink agent={actor.agent} />],
              ["Agent profile", actor.agent?.agentProfile, TERM_HINT.agentProfile],
              ["Model", actor.agent?.model],
              ["Atespace", actor.atespace, TERM_HINT.atespace],
              ["Actor template", actor.actorTemplate, TERM_HINT.actorTemplate],
              ["Size", sizeText(actor.size), TERM_HINT.size],
              ["Worker selector", workerSelectorText(actor.workerSelector), TERM_HINT.workerSelector],
              ["Worker pools", workerPoolsText(actor.usableWorkerPools), TERM_HINT.workerPool],
              ["Actor state", <ActorStateBadge state={actor.state} />, TERM_HINT.actorState],
              ["Created", formatTimestamp(actor.createdAt)],
              ["Last change", formatTimestamp(actor.updatedAt)],
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
