import type { ReactNode } from "react";

export function SectionHeading({ children }: { children: ReactNode }) {
  return <h2 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">{children}</h2>;
}
