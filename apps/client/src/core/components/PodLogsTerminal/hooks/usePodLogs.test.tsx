import type { ReactNode } from "react";
import { act } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestQueryClient } from "@/test/utils";
import { renderInActivity } from "@/test/utils/activity";
import { FLUSH_INTERVAL_MS, usePodLogs } from "./usePodLogs";

type Handlers = { onData: (data: { type: string; logs?: string }) => void; onError: (error: unknown) => void };

const { subscribe, unsubscribe, trpcClient } = vi.hoisted(() => {
  const subscribe = vi.fn();
  return {
    subscribe,
    unsubscribe: vi.fn(),
    trpcClient: { k8s: { watchPodLogs: { subscribe }, podLogs: { query: vi.fn() } } },
  };
});

vi.mock("@/core/providers/trpc", () => ({ useTRPCClient: () => trpcClient }));

const handlersOf = (call: number) => subscribe.mock.calls[call][1] as Handlers;

function LogsProbe({
  onStreamStart,
  onStreamLines,
}: {
  onStreamStart: () => void;
  onStreamLines: (l: string[]) => void;
}) {
  usePodLogs({
    clusterName: "c",
    namespace: "ns",
    podName: "pod",
    container: "main",
    follow: true,
    onStreamStart,
    onStreamLines,
  });
  return null;
}

const renderProbe = () => {
  const onStreamStart = vi.fn();
  const onStreamLines = vi.fn();
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const view = renderInActivity(() => <LogsProbe onStreamStart={onStreamStart} onStreamLines={onStreamLines} />, {
    wrapper,
  });
  return { onStreamStart, onStreamLines, setMode: view.setMode };
};

describe("usePodLogs streaming", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    subscribe.mockReset().mockReturnValue({ unsubscribe });
    unsubscribe.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("signals a stream start before each subscription, including a re-show", () => {
    const { onStreamStart, setMode } = renderProbe();

    expect(subscribe).toHaveBeenCalledTimes(1);
    expect(onStreamStart).toHaveBeenCalledTimes(1);

    setMode("hidden");
    expect(unsubscribe).toHaveBeenCalledTimes(1);

    setMode("visible");
    expect(subscribe).toHaveBeenCalledTimes(2);
    expect(onStreamStart).toHaveBeenCalledTimes(2);
  });

  it("signals a stream start before a retry", () => {
    const { onStreamStart } = renderProbe();

    act(() => handlersOf(0).onError(new Error("container not created yet")));
    act(() => vi.advanceTimersByTime(1000));

    expect(subscribe).toHaveBeenCalledTimes(2);
    expect(onStreamStart).toHaveBeenCalledTimes(2);
  });

  it("drops a partial line buffered by the previous subscription", () => {
    const { onStreamLines } = renderProbe();

    act(() => handlersOf(0).onData({ type: "data", logs: "partial" }));
    act(() => handlersOf(0).onError(new Error("container not created yet")));
    act(() => vi.advanceTimersByTime(1000));
    act(() => handlersOf(1).onData({ type: "data", logs: "fresh\n" }));
    act(() => vi.advanceTimersByTime(FLUSH_INTERVAL_MS));

    expect(onStreamLines).toHaveBeenCalledTimes(1);
    expect(onStreamLines).toHaveBeenCalledWith(["fresh"]);
  });
});
