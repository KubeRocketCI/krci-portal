import { Rocket } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import KubernetesIcon from "@/assets/icons/k8s/kubernetes.svg?react";
import { TooltipContent, TooltipRoot, TooltipTrigger } from "@/core/components/ui/tooltip";
import { cn } from "@/core/utils/classname";

export type Mode = "krci" | "k8s";

interface ModeOption {
  value: Mode;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Extra classes for the icon (e.g. `fill-current` for filled SVGs that need to follow text color). */
  iconClassName?: string;
}

const MODE_OPTIONS: ModeOption[] = [
  { value: "krci", label: "KRCI", icon: Rocket },
  // KubernetesIcon is a filled SVG with no `fill` attribute, so `fill-current` makes it follow the text color.
  { value: "k8s", label: "Kubernetes", icon: KubernetesIcon, iconClassName: "fill-current" },
];

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
        const button = (
          <button
            key={value}
            type="button"
            // Collapsed rail is icon-only, so expose the label to assistive tech via the tooltip text.
            aria-label={isMinimized ? modeLabel : undefined}
            aria-pressed={isActive}
            onClick={() => onSelect(value)}
            className={cn(
              "flex items-center justify-center rounded",
              isMinimized ? "h-7 w-full" : "flex-1 gap-1.5 px-2 py-1 text-xs font-medium",
              isActive ? "bg-background shadow-sm" : "text-muted-foreground",
              !isActive && isMinimized && "hover:text-foreground"
            )}
          >
            <Icon className={cn(isMinimized ? "h-3.5 w-3.5" : "h-3 w-3", iconClassName)} aria-hidden />
            {!isMinimized && label}
          </button>
        );

        if (!isMinimized) {
          return button;
        }

        return (
          <TooltipRoot key={value}>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent side="right" align="center">
              {modeLabel}
            </TooltipContent>
          </TooltipRoot>
        );
      })}
    </div>
  );
}
