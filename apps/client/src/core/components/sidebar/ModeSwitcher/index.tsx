import { Tooltip } from "@/core/components/ui/tooltip";
import { cn } from "@/core/utils/classname";
import { MODE_OPTIONS, type Mode } from "./mode";

interface ModeSwitcherProps {
  mode: Mode;
  onSelect: (m: Mode) => void;
  /** Renders a compact, icon-only vertical toggle that fits the collapsed sidebar rail. */
  isMinimized?: boolean;
}

export function ModeSwitcher({ mode, onSelect, isMinimized = false }: ModeSwitcherProps) {
  return (
    <div
      role="group"
      aria-label="Mode switcher"
      className={cn("bg-muted flex items-center gap-1 rounded-md border p-1", isMinimized && "flex-col")}
    >
      {MODE_OPTIONS.map(({ value, label, icon: Icon, iconClassName }) => {
        const isActive = mode === value;
        const modeLabel = `${label} Mode`;
        const showsLabel = !isMinimized && isActive;
        const button = (
          <button
            key={value}
            type="button"
            aria-label={showsLabel ? undefined : modeLabel}
            aria-pressed={isActive}
            onClick={() => onSelect(value)}
            className={cn(
              "flex items-center justify-center rounded border border-transparent",
              isMinimized && "h-7 w-full",
              showsLabel && "h-6 min-w-0 flex-1 gap-1.5 px-2 text-xs font-medium",
              !isMinimized && !isActive && "h-6 w-8 shrink-0",
              // Active state of the shadcn TabsTrigger (ui/tabs).
              isActive
                ? "bg-background dark:border-input dark:bg-input/30 shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className={cn(isMinimized ? "size-3.5" : "size-3", iconClassName)} aria-hidden />
            {showsLabel && <span className="truncate">{label}</span>}
          </button>
        );

        if (showsLabel) {
          return button;
        }

        return (
          <Tooltip key={value} title={modeLabel} placement={isMinimized ? "right" : "bottom"}>
            {button}
          </Tooltip>
        );
      })}
    </div>
  );
}
