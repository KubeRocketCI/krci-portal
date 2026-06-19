import * as React from "react";
import { cn } from "@/core/utils/classname";

/** Monospace pill for technical values in the Networking tab — API groups, RBAC verbs, addresses. */
export function InlineCode({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <code
      className={cn("bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-xs whitespace-nowrap", className)}
    >
      {children}
    </code>
  );
}
