import * as React from "react";
import { cn } from "@/core/utils/classname";

interface NetworkNoticeProps {
  variant?: "destructive" | "muted";
  /**
   * Two icons rendered as a cluster in the top-left of the banner.
   * Pass exactly two lucide icons, e.g. `<><ShieldAlert /><Lock /></>`.
   */
  icons: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

/**
 * Large, prominent banner for the Networking tab's empty/blocked states
 * (Gateway API not installed, permission denied). Renders a two-icon cluster
 * in the top-left, a big title, and a description. Unlike the shared `Alert`
 * primitive it does not inject its own icon, so the icon cluster is exactly
 * what the caller passes.
 */
export function NetworkNotice({ variant = "destructive", icons, title, children }: NetworkNoticeProps) {
  const destructive = variant === "destructive";

  return (
    <div
      role="alert"
      className={cn(
        "relative w-full overflow-hidden rounded-xl border p-8 sm:p-10",
        destructive ? "border-destructive/40 bg-destructive/10 dark:bg-destructive/15" : "border-border bg-muted/40"
      )}
    >
      <div
        className={cn(
          "mb-6 flex w-fit items-center gap-3 rounded-xl p-3 [&>svg]:size-8",
          destructive ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"
        )}
      >
        {icons}
      </div>

      <h3 className={cn("text-2xl font-semibold tracking-tight", destructive ? "text-destructive" : "text-foreground")}>
        {title}
      </h3>
      <div
        className={cn(
          "mt-3 max-w-3xl text-base leading-relaxed",
          destructive ? "text-destructive/90" : "text-muted-foreground"
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** Inline code chip tuned for the destructive banner background. */
export function NoticeCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-destructive/15 rounded px-1.5 py-0.5 font-mono text-sm whitespace-nowrap">{children}</code>
  );
}
