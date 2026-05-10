import { Box, Rocket } from "lucide-react";
import { cn } from "@/core/utils/classname";

export type Mode = "krci" | "k8s";

export function ModeSwitcher({ mode, onSelect }: { mode: Mode; onSelect: (m: Mode) => void }) {
  return (
    <div role="group" aria-label="Mode switcher" className="bg-muted flex items-center gap-1 rounded-md border p-1">
      <button
        type="button"
        aria-pressed={mode === "krci"}
        onClick={() => onSelect("krci")}
        className={cn(
          "flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1 text-xs font-medium",
          mode === "krci" ? "bg-background shadow-sm" : "text-muted-foreground"
        )}
      >
        <Rocket size={12} aria-hidden /> KRCI
      </button>
      <button
        type="button"
        aria-pressed={mode === "k8s"}
        onClick={() => onSelect("k8s")}
        className={cn(
          "flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1 text-xs font-medium",
          mode === "k8s" ? "bg-background shadow-sm" : "text-muted-foreground"
        )}
      >
        <Box size={12} aria-hidden /> Kubernetes
      </button>
    </div>
  );
}
