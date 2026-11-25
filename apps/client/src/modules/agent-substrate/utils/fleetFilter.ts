import { ACTOR_STATE_GROUP, actorStateGroupSchema, sortByName, type ActorRow } from "@my-project/shared";
import type { SelectOption } from "@/core/components/form";
import { ACTOR_STATE_GROUP_LABEL } from "../constants/actorState";
import { agentProfileFilterValue, agentProfileLabel } from "../constants/actorFilter";

/**
 * `_` cannot be in atespace, Codebase, agent profile or worker pool names, so this value cannot collide with one. The
 * `all` of `createExactMatchFunction` of the core Filter provider can be an agent profile name.
 */
export const ALL_FILTER_VALUE = "__all__";

export const ALL_OPTION: SelectOption = { label: "All", value: ALL_FILTER_VALUE };

/**
 * `normalizeUrlValues` of a fleet list page. The router JSON-parses each search value, so a hand-typed
 * `?agentProfile=007` arrives as the number 7 and `=null` as null. A filter value that is not a string is taken from the
 * URL text instead. The Filter provider passes every filter key: it merges the default values first.
 */
export function withRawSearchValues<Values extends Record<string, string>>(searchStr: string) {
  const raw = new URLSearchParams(searchStr);
  return (values: Partial<Values>): Partial<Values> => {
    const restored = { ...values };
    for (const name of Object.keys(restored) as (keyof Values & string)[]) {
      const text = raw.get(name);
      if (text !== null && typeof restored[name] !== "string") restored[name] = text as Values[typeof name];
    }
    return restored;
  };
}

export const exactMatch =
  (valueOf: (actor: ActorRow) => string | undefined) =>
  (actor: ActorRow, value: string): boolean =>
    !value || value === ALL_FILTER_VALUE || valueOf(actor) === value;

export const codebaseMatch = exactMatch((actor) => actor.agent?.codebase?.name);

export const agentProfileMatch = exactMatch((actor) =>
  actor.agent ? agentProfileFilterValue(actor.agent.agentProfile) : undefined
);

export const actorStateMatch = exactMatch((actor) => ACTOR_STATE_GROUP[actor.state]);

export const actorStateOptions: SelectOption[] = [
  ALL_OPTION,
  ...actorStateGroupSchema.options.map((group) => ({ label: ACTOR_STATE_GROUP_LABEL[group], value: group })),
];

const sortedOptions = (names: Iterable<string>): SelectOption[] =>
  [...new Set(names)].sort(sortByName).map((name) => ({ label: name, value: name }));

export function codebaseOptions(actors: ActorRow[]): SelectOption[] {
  return [ALL_OPTION, ...sortedOptions(actors.flatMap(({ agent }) => (agent?.codebase ? [agent.codebase.name] : [])))];
}

export function agentProfileOptions(actors: ActorRow[]): SelectOption[] {
  const agents = actors.flatMap(({ agent }) => (agent ? [agent] : []));
  const options = [
    ALL_OPTION,
    ...sortedOptions(agents.flatMap(({ agentProfile }) => (agentProfile ? [agentProfile] : []))),
  ];
  if (agents.some(({ agentProfile }) => agentProfile === null)) {
    options.push({ label: agentProfileLabel(null), value: agentProfileFilterValue(null) });
  }
  return options;
}

export const agentRows = (actors: ActorRow[]): ActorRow[] => actors.filter(({ agent }) => agent !== null);
