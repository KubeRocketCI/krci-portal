import { LayoutGrid, List } from "lucide-react";
import { VIEW_MODES } from "@/core/providers/ViewMode/types";
import type { ViewToggleOption } from "../../../components/ViewToggle";
import type { AgentsView } from "./utils/view";

export const AGENTS_VIEW_ENTITY_ID = "agentAgents";

export const AGENTS_VIEW_OPTIONS: readonly ViewToggleOption<AgentsView>[] = [
  { value: VIEW_MODES.TABLE, label: "Table", icon: List },
  { value: VIEW_MODES.GRID, label: "By codebase", icon: LayoutGrid },
];

export const AGENTS_EMPTY_TEXT = "No agents";

export const AGENT_TABLE_SORT = { sortBy: "issue", order: "asc" } as const;
