import type { ReactNode } from "react";

/** `id`: for `aria-labelledby` on the section. */
export function SectionHeading({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2 id={id} className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
      {children}
    </h2>
  );
}
