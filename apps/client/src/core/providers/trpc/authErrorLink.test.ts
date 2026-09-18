import { describe, expect, it, vi } from "vitest";
import { TRPCClientError, type Operation } from "@trpc/client";
import { observable } from "@trpc/server/observable";
import { createAuthErrorLink, isSessionAuthError } from "./authErrorLink";

const trpcError = (data: Record<string, unknown>) =>
  TRPCClientError.from({ error: { message: "failed", code: -32001, data } });

const op = { id: 1, type: "query", path: "k8s.list", input: undefined, context: {}, signal: null } as Operation;

const runLink = (source: ReturnType<typeof observable>, onAuthError = vi.fn()) => {
  const observer = { next: vi.fn(), error: vi.fn(), complete: vi.fn() };
  const link = createAuthErrorLink({ onAuthError })({} as never);

  link({ op, next: () => source as never }).subscribe(observer);

  return { observer, onAuthError };
};

describe("isSessionAuthError", () => {
  it("matches UNAUTHORIZED raised by the portal", () => {
    expect(isSessionAuthError(trpcError({ code: "UNAUTHORIZED", httpStatus: 401 }))).toBe(true);
  });

  it("ignores UNAUTHORIZED sourced from the K8s API", () => {
    expect(isSessionAuthError(trpcError({ code: "UNAUTHORIZED", httpStatus: 401, source: "k8s" }))).toBe(false);
  });

  it("ignores FORBIDDEN and other codes", () => {
    expect(isSessionAuthError(trpcError({ code: "FORBIDDEN", httpStatus: 403 }))).toBe(false);
    expect(isSessionAuthError(trpcError({ code: "INTERNAL_SERVER_ERROR", httpStatus: 500 }))).toBe(false);
  });

  it("ignores errors without tRPC data", () => {
    expect(isSessionAuthError(TRPCClientError.from(new Error("network")))).toBe(false);
  });
});

describe("createAuthErrorLink", () => {
  it("reports a session error and still propagates it", () => {
    const error = trpcError({ code: "UNAUTHORIZED", httpStatus: 401 });
    const { observer, onAuthError } = runLink(observable((obs) => obs.error(error)));

    expect(onAuthError).toHaveBeenCalledTimes(1);
    expect(observer.error).toHaveBeenCalledWith(error);
  });

  it("does not report a K8s-sourced UNAUTHORIZED", () => {
    const error = trpcError({ code: "UNAUTHORIZED", httpStatus: 401, source: "k8s" });
    const { observer, onAuthError } = runLink(observable((obs) => obs.error(error)));

    expect(onAuthError).not.toHaveBeenCalled();
    expect(observer.error).toHaveBeenCalledWith(error);
  });

  it("propagates other errors without reporting", () => {
    const error = trpcError({ code: "FORBIDDEN", httpStatus: 403 });
    const { observer, onAuthError } = runLink(observable((obs) => obs.error(error)));

    expect(onAuthError).not.toHaveBeenCalled();
    expect(observer.error).toHaveBeenCalledWith(error);
  });

  it("forwards results untouched", () => {
    const { observer, onAuthError } = runLink(
      observable((obs) => {
        obs.next({ result: { data: 42 } });
        obs.complete();
      })
    );

    expect(observer.next).toHaveBeenCalledWith({ result: { data: 42 } });
    expect(observer.complete).toHaveBeenCalledTimes(1);
    expect(onAuthError).not.toHaveBeenCalled();
  });
});
