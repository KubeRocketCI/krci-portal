import { cn } from "@/core/utils/classname";
import type { SectionProps } from "../../types";

export function Section({ title, children, grid = false }: SectionProps) {
  return (
    <section className="space-y-2">
      <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{title}</h3>
      <div className={cn("grid gap-3", grid ? "md:grid-cols-2" : "grid-cols-1")}>{children}</div>
    </section>
  );
}
