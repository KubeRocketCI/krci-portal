import React from "react";
import { Link } from "@tanstack/react-router";
import { Bot, Boxes, Server } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { actorStateGroupSchema, type ReadyFleetSnapshot } from "@my-project/shared";
import { SectionHeading } from "@/core/components/SectionHeading";
import { StatCard, StatErrorIcon, StatHealthLine, StatSubLine } from "@/core/components/StatCard";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { cn } from "@/core/utils/classname";
import { useClusterStore } from "@/k8s/store";
import { agentProfileLabel } from "../../../../constants/actorFilter";
import { ACTOR_STATE_GROUP_LABEL } from "../../../../constants/actorState";
import {
  PATH_AGENT_ACTORS_FULL,
  PATH_AGENT_WORKER_POOLS_FULL,
  PATH_AGENT_WORKERS_FULL,
} from "../../../../constants/paths";
import {
  actorStateSearch,
  agentProfileSearch,
  agentsSubText,
  fleetRoom,
  roomSubText,
  workersHealth,
} from "../../utils/atAGlance";

const COUNT_LINK_CLASS =
  "hover:bg-muted focus-visible:ring-ring flex min-w-0 flex-col gap-0.5 rounded-md px-3 py-2 focus-visible:ring-2 focus-visible:outline-none";

const COUNT_GRID_CLASS = "grid grid-cols-2 gap-1 sm:grid-cols-3 xl:grid-cols-5";

function CountCard({ title, children }: { title: string; children: React.ReactNode }) {
  const titleId = React.useId();
  return (
    <Card role="region" aria-labelledby={titleId}>
      <CardHeader className="p-4 pb-2">
        <CardTitle id={titleId} className="text-sm font-semibold">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 pt-0">{children}</CardContent>
    </Card>
  );
}

function CountLink({
  clusterName,
  search,
  label,
  count,
  tone,
}: {
  clusterName: string;
  search: Record<string, string>;
  label: string;
  count: number;
  tone?: "error";
}) {
  return (
    <li>
      <Link to={PATH_AGENT_ACTORS_FULL} params={{ clusterName }} search={search} className={COUNT_LINK_CLASS}>
        <TextWithTooltip text={label} className="text-muted-foreground text-xs" />
        <span
          className={cn(
            "flex items-center gap-1 text-lg font-semibold tabular-nums",
            tone === "error" && "text-status-error"
          )}
        >
          {count}
          {tone === "error" && <StatErrorIcon className="h-3.5 w-3.5" />}
        </span>
      </Link>
    </li>
  );
}

/** With no atespace, only the Workers and Room cards. With no actor template, room counts actors only. */
export function AtAGlance({ fleet }: { fleet: ReadyFleetSnapshot }) {
  const headingId = React.useId();
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));
  const { summary, workerPools } = fleet;
  const hasAtespaces = fleet.atespaces.length > 0;
  const health = workersHealth(fleet);
  const room = fleetRoom(workerPools);

  return (
    <section aria-labelledby={headingId}>
      <SectionHeading id={headingId}>At a glance</SectionHeading>
      <div className="flex flex-col gap-4">
        <div className={cn("grid gap-3", hasAtespaces ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
          {hasAtespaces && (
            <Link to={PATH_AGENT_ACTORS_FULL} params={{ clusterName }} className="group block">
              <StatCard
                icon={Bot}
                label="Agents"
                value={summary.agents}
                detail={<StatSubLine>{agentsSubText(summary)}</StatSubLine>}
              />
            </Link>
          )}
          <Link to={PATH_AGENT_WORKERS_FULL} params={{ clusterName }} className="group block">
            <StatCard
              icon={Server}
              label="Workers"
              value={summary.workers}
              detail={
                health && (
                  <StatHealthLine
                    ok={health.severity === "ok"}
                    okText={health.text}
                    badText={health.text}
                    badTone={health.severity === "warning" ? "warning" : "error"}
                  />
                )
              }
            />
          </Link>
          <Link to={PATH_AGENT_WORKER_POOLS_FULL} params={{ clusterName }} className="group block">
            <StatCard
              icon={Boxes}
              label="Room"
              value={room}
              tone={room === 0 ? "error" : undefined}
              toneLabel="No room"
              detail={<StatSubLine>{roomSubText(workerPools.items.length)}</StatSubLine>}
            />
          </Link>
        </div>

        {hasAtespaces && (
          <div className="grid gap-4 lg:grid-cols-2">
            <CountCard title="Actor state">
              <ul className={COUNT_GRID_CLASS}>
                {actorStateGroupSchema.options.map((group) => (
                  <CountLink
                    key={group}
                    clusterName={clusterName}
                    search={actorStateSearch(group)}
                    label={ACTOR_STATE_GROUP_LABEL[group]}
                    count={summary.actorsByState[group]}
                    tone={group === "crashed" && summary.actorsByState.crashed > 0 ? "error" : undefined}
                  />
                ))}
              </ul>
            </CountCard>

            <CountCard title="Agents by agent profile">
              {summary.agentsByProfile.length === 0 ? (
                <p className="text-muted-foreground px-3 py-2 text-xs">No agents</p>
              ) : (
                <ul className={COUNT_GRID_CLASS}>
                  {summary.agentsByProfile.map(({ agentProfile, agents }) => (
                    <CountLink
                      key={agentProfile ?? ""}
                      clusterName={clusterName}
                      search={agentProfileSearch(agentProfile)}
                      label={agentProfileLabel(agentProfile)}
                      count={agents}
                    />
                  ))}
                </ul>
              )}
            </CountCard>
          </div>
        )}
      </div>
    </section>
  );
}
