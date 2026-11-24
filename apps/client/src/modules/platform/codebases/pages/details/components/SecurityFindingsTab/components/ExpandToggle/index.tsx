import { ChevronDown, ChevronRight } from "lucide-react";

export interface ExpandToggleProps {
  expanded: boolean;
  panelId: string;
  title: string;
  onToggle: () => void;
}

export function ExpandToggle({ expanded, panelId, title, onToggle }: ExpandToggleProps) {
  return (
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls={panelId}
      aria-label={`${expanded ? "Hide" : "Show"} findings of ${title}`}
      onClick={onToggle}
      className="hover:bg-input focus-visible:ring-ring rounded p-1 focus-visible:ring-2 focus-visible:outline-none"
    >
      {expanded ? <ChevronDown className="size-4" aria-hidden /> : <ChevronRight className="size-4" aria-hidden />}
    </button>
  );
}
