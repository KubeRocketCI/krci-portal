import type React from "react";
import { useRouterState } from "@tanstack/react-router";

/** The story router renders the page at every path; this shows where a click went. */
function Location() {
  const href = useRouterState({ select: (state) => state.location.href });
  return <output aria-label="Location">{href}</output>;
}

/** `contentWrapper` of `withAppProviders`: read the location as the status named `Location`. */
export function WithLocation({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Location />
    </>
  );
}
