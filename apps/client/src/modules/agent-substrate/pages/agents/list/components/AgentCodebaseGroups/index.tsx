import React from "react";
import { Link } from "@tanstack/react-router";
import { useShallow } from "zustand/react/shallow";
import type { ActorRow } from "@my-project/shared";
import { EmptyList } from "@/core/components/EmptyList";
import { DataTable } from "@/core/components/Table";
import { Button } from "@/core/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { useIsNarrow } from "@/core/hooks/use-narrow";
import { useFilterContext } from "@/core/providers/Filter";
import { cn } from "@/core/utils/classname";
import { TABLE } from "@/k8s/constants/tables";
import { useClusterStore } from "@/k8s/store";
import { PATH_PROJECT_DETAILS_FULL } from "@/modules/platform/codebases/pages/details/route";
import { codebaseColumn } from "../../../../../components/ActorColumns";
import { plural } from "../../../../../utils/plural";
import { AGENT_TABLE_SORT, AGENTS_EMPTY_TEXT } from "../../constants";
import { useAgentRowClick } from "../../hooks/useAgentRowClick";
import { groupAgentsByCodebase, type AgentCodebaseGroup } from "../../utils/groupByCodebase";
import { AgentFilter } from "../AgentFilter";
import type { AgentFilterValues } from "../AgentFilter/types";
import { AgentProfileChips } from "../AgentProfileChips";
import { agentColumns } from "../AgentList/columns";

const TABLE_SETTINGS = { show: false } as const;

/** All cards read one URL `page` param; with no pager, a table ignores it and shows all its rows. */
const TABLE_PAGINATION = { show: false } as const;

const COLUMNS = agentColumns.filter(({ id }) => id !== codebaseColumn.id);

function AgentCodebaseTitle({ group, clusterName }: { group: AgentCodebaseGroup; clusterName: string }) {
  if (!group.codebase) return <CardTitle className="text-base">{group.projectPath}</CardTitle>;

  return (
    <CardTitle className="text-base">
      <Button variant="link" asChild className="h-auto p-0 text-base">
        <Link
          to={PATH_PROJECT_DETAILS_FULL}
          params={{ clusterName, namespace: group.codebase.namespace, name: group.codebase.name }}
        >
          {group.codebase.name}
        </Link>
      </Button>
    </CardTitle>
  );
}

interface AgentCodebaseCardProps {
  group: AgentCodebaseGroup;
  clusterName: string;
  handleRowClick: (event: React.MouseEvent<HTMLTableRowElement>, actor: ActorRow) => void;
}

function AgentCodebaseCard({ group, clusterName, handleRowClick }: AgentCodebaseCardProps) {
  const label = group.codebase ? `Codebase ${group.codebase.name}` : `Project ${group.projectPath}`;

  return (
    <Card role="region" aria-label={label}>
      <CardHeader className="flex flex-row flex-wrap items-baseline gap-x-3 gap-y-1">
        <AgentCodebaseTitle group={group} clusterName={clusterName} />
        <span className="text-muted-foreground text-xs">
          {plural(group.agents.length, "agent")} · {group.running} running
        </span>
      </CardHeader>
      <CardContent>
        {/* The Table view id: its saved column settings apply to the cards too. */}
        <DataTable<ActorRow>
          id={TABLE.AGENT_LIST.id}
          name={TABLE.AGENT_LIST.name}
          data={group.agents}
          columns={COLUMNS}
          sort={AGENT_TABLE_SORT}
          settings={TABLE_SETTINGS}
          pagination={TABLE_PAGINATION}
          handleRowClick={handleRowClick}
          outlined={false}
        />
      </CardContent>
    </Card>
  );
}

/** The view By codebase. `agents`: the actors that host an agent. */
export function AgentCodebaseGroups({ agents }: { agents: ActorRow[] }) {
  const { filterFunction } = useFilterContext<ActorRow, AgentFilterValues>();
  const clusterName = useClusterStore(useShallow((state) => state.clusterName));
  const handleRowClick = useAgentRowClick();
  const isNarrow = useIsNarrow();

  const groups = React.useMemo(() => groupAgentsByCodebase(agents.filter(filterFunction)), [agents, filterFunction]);

  return (
    <div className="flex flex-col gap-4">
      <AgentProfileChips agents={agents} />
      {/* Stacked where the Table view moves its filters into a sheet. */}
      <div className={cn("gap-4", isNarrow ? "flex flex-col" : "grid grid-cols-12")}>
        <AgentFilter agents={agents} byCodebase />
      </div>
      {groups.length === 0 && agents.length === 0 && <EmptyList customText={AGENTS_EMPTY_TEXT} />}
      {groups.length === 0 && agents.length > 0 && <EmptyList customText="No results found!" isSearch />}
      {groups.length > 0 && (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <AgentCodebaseCard
              key={group.key}
              group={group}
              clusterName={clusterName}
              handleRowClick={handleRowClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
