import { AGENT_FILTER_NAMES } from "../constants/agentFilter";

/** Agents page filters that the Actors page had; Overview agent profile counts linked to the Actors page with them. */
const MOVED_FILTER_NAMES = [AGENT_FILTER_NAMES.CODEBASE, AGENT_FILTER_NAMES.AGENT_PROFILE];

/**
 * The Agents page search for an Actors page URL with an agent profile or Codebase filter; null when it has neither.
 * Reads the raw URL text: the router JSON-parses search values, so `007` arrives as the number 7.
 */
export function agentsSearchOfActorsUrl(searchStr: string): Record<string, string> | null {
  const raw = new URLSearchParams(searchStr);
  if (!MOVED_FILTER_NAMES.some((name) => raw.has(name))) return null;

  const search: Record<string, string> = {};
  for (const name of Object.values(AGENT_FILTER_NAMES)) {
    const value = raw.get(name);
    if (value !== null) search[name] = value;
  }
  return search;
}
