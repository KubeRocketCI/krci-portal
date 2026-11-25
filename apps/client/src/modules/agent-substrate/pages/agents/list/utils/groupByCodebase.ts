import { ACTOR_STATE_GROUP, sortByName, type ActorRow, type CodebaseRef } from "@my-project/shared";

export interface AgentCodebaseGroup {
  key: string;
  /** Null: no Codebase matches the project path; the group is the project path. */
  codebase: CodebaseRef | null;
  /** The project path of the first agent. */
  projectPath: string;
  /** In input order. */
  agents: ActorRow[];
  /** Agents whose actor state is in the group running. */
  running: number;
}

/** Codebase groups first, by name, then namespace; then project path groups, by path. */
function compareGroups(a: AgentCodebaseGroup, b: AgentCodebaseGroup): number {
  if (a.codebase && b.codebase) {
    return sortByName(a.codebase.name, b.codebase.name) || sortByName(a.codebase.namespace, b.codebase.namespace);
  }
  if (a.codebase) return -1;
  if (b.codebase) return 1;
  return sortByName(a.projectPath, b.projectPath);
}

/** Actors that host no agent are left out. */
export function groupAgentsByCodebase(actors: ActorRow[]): AgentCodebaseGroup[] {
  const groups = new Map<string, AgentCodebaseGroup>();

  for (const actor of actors) {
    if (!actor.agent) continue;
    const { codebase, issue } = actor.agent;
    const key = codebase
      ? JSON.stringify(["codebase", codebase.namespace, codebase.name])
      : JSON.stringify(["project", issue.projectPath]);

    let group = groups.get(key);
    if (!group) {
      group = { key, codebase, projectPath: issue.projectPath, agents: [], running: 0 };
      groups.set(key, group);
    }
    group.agents.push(actor);
    if (ACTOR_STATE_GROUP[actor.state] === "running") group.running += 1;
  }

  return [...groups.values()].sort(compareGroups);
}
