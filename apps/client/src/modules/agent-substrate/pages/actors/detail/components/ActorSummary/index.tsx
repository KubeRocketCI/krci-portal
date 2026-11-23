import type { ActorRow } from "@my-project/shared";
import { Alert } from "@/core/components/ui/alert";
import { Card, CardContent } from "@/core/components/ui/card";
import { formatTimestamp } from "@/core/utils/date-humanize";
import { ActorCodebase, ActorIssue, ActorStateBadge } from "../../../../../components/ActorCells";
import { KV } from "../../../../../components/KV";

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
              ["Issue", <ActorIssue agent={actor.agent} />],
              ["Codebase", <ActorCodebase agent={actor.agent} />],
              ["Agent profile", actor.agent?.agentProfile],
              ["Model", actor.agent?.model],
              ["Atespace", actor.atespace],
              ["Actor template", actor.actorTemplate],
              ["Actor state", <ActorStateBadge state={actor.state} />],
              ["Created", formatTimestamp(actor.createdAt)],
              ["Last change", formatTimestamp(actor.updatedAt)],
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
