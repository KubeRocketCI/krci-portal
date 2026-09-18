import type { AppRouter } from "@my-project/trpc";
import type { TRPCLink } from "@trpc/client";
import { observable } from "@trpc/server/observable";
import type { RequestError } from "../../types/global";

/** UNAUTHORIZED raised by the portal itself. K8s-sourced and FORBIDDEN errors are permission problems, not session expiry. */
export function isSessionAuthError(error: RequestError): boolean {
  return error.data?.code === "UNAUTHORIZED" && error.data?.source !== "k8s";
}

/** Calls `onAuthError` for every operation that fails with a session error, on every transport. The error still propagates. */
export const createAuthErrorLink =
  ({ onAuthError }: { onAuthError: () => void }): TRPCLink<AppRouter> =>
  () =>
  ({ op, next }) =>
    observable((observer) =>
      next(op).subscribe({
        next: observer.next,
        complete: observer.complete,
        error: (error) => {
          if (isSessionAuthError(error)) {
            onAuthError();
          }
          observer.error(error);
        },
      })
    );
