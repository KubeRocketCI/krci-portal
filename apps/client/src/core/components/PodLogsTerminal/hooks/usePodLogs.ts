import { useTRPCClient } from "@/core/providers/trpc";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef, useCallback } from "react";

interface UsePodLogsParams {
  clusterName: string;
  namespace: string;
  podName: string;
  container?: string;
  follow?: boolean;
  tailLines?: number;
  timestamps?: boolean;
  previous?: boolean;
  enabled?: boolean;
  /** Called with new log lines during streaming (follow=true). Bypasses state accumulation. */
  onStreamLines?: (lines: string[]) => void;
}

interface UsePodLogsResult {
  /** Full log content (only populated when follow=false). */
  logs: string;
  isLoading: boolean;
  error: Error | null;
}

/** How often (ms) buffered subscription chunks are flushed. */
const FLUSH_INTERVAL_MS = 500;

function isContainerNotReadyError(message: string): boolean {
  return (
    message.includes("container not created yet") ||
    message.includes("Error occurred in log request") ||
    message.includes("400") ||
    message.includes("404") ||
    message.includes("204")
  );
}

export const usePodLogs = ({
  clusterName,
  namespace,
  podName,
  container,
  follow = false,
  tailLines = 100,
  timestamps = false,
  previous = false,
  enabled = true,
  onStreamLines,
}: UsePodLogsParams): UsePodLogsResult => {
  const trpc = useTRPCClient();
  const [subscriptionError, setSubscriptionError] = useState<Error | null>(null);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  // Stable ref for the streaming callback to avoid re-subscribing when it changes.
  const onStreamLinesRef = useRef(onStreamLines);
  useEffect(() => {
    onStreamLinesRef.current = onStreamLines;
  }, [onStreamLines]);

  // Buffer for throttling subscription chunks.
  const bufferRef = useRef<string[]>([]);
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const flushBuffer = useCallback(() => {
    if (bufferRef.current.length === 0) return;
    const chunk = bufferRef.current.join("");
    bufferRef.current = [];

    // Split into lines, keeping partial last line for next flush
    const lines = chunk.split("\n");
    // If chunk ends with \n, last element is empty string — drop it.
    // If chunk doesn't end with \n, last element is a partial line — keep it in buffer.
    if (lines.length > 0 && lines[lines.length - 1] === "") {
      lines.pop();
    } else if (lines.length >= 1) {
      // Last element is a partial line — put it back in the buffer
      bufferRef.current.push(lines.pop()!);
    }

    if (lines.length > 0) {
      onStreamLinesRef.current?.(lines);
    }
  }, []);

  const subscriptionEnabled = follow && enabled && !!podName && !!container;

  // Query for initial logs (non-follow mode only)
  const {
    data: queryData,
    isLoading: queryLoading,
    error: queryError,
  } = useQuery({
    queryKey: ["pod-logs-query", namespace, podName, container, clusterName, tailLines, timestamps, previous],
    queryFn: () =>
      trpc.k8s.podLogs.query({
        clusterName,
        namespace,
        podName,
        container,
        follow: false,
        tailLines,
        timestamps,
        previous,
      }),
    enabled: !follow && enabled && !!podName && !!container,
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (isContainerNotReadyError(error?.message || "") && failureCount < 10) {
        return true;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  // Subscription for follow mode with retry logic
  useEffect(() => {
    if (!subscriptionEnabled) {
      if (flushTimerRef.current) {
        clearInterval(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      bufferRef.current = [];
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      return;
    }

    let retryCount = 0;
    const maxRetries = 10;
    let retryTimer: ReturnType<typeof setTimeout>;

    // Start periodic flush timer
    flushTimerRef.current = setInterval(flushBuffer, FLUSH_INTERVAL_MS);

    let loadingCleared = false;

    const startSubscription = () => {
      loadingCleared = false;
      setIsSubscriptionLoading(true);
      setSubscriptionError(null);

      try {
        subscriptionRef.current = trpc.k8s.watchPodLogs.subscribe(
          {
            clusterName,
            namespace,
            podName,
            container,
            follow: true,
            tailLines,
            timestamps,
            previous,
          },
          {
            onData: (data: { type: string; logs?: string }) => {
              if (!loadingCleared) {
                loadingCleared = true;
                setIsSubscriptionLoading(false);
              }
              retryCount = 0;
              if (data.type === "data" && data.logs) {
                bufferRef.current.push(data.logs);
              } else if (data.type === "end") {
                flushBuffer();
              }
            },
            onError: (error: unknown) => {
              setIsSubscriptionLoading(false);
              setSubscriptionError(error as Error);

              if (isContainerNotReadyError((error as Error)?.message || "") && retryCount < maxRetries) {
                retryCount++;
                const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
                retryTimer = setTimeout(() => {
                  if (subscriptionRef.current) {
                    subscriptionRef.current.unsubscribe();
                  }
                  startSubscription();
                }, delay);
              }
            },
          }
        );
      } catch (error) {
        setIsSubscriptionLoading(false);
        setSubscriptionError(error as Error);

        if (retryCount < maxRetries) {
          retryCount++;
          const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
          retryTimer = setTimeout(startSubscription, delay);
        }
      }
    };

    startSubscription();

    return () => {
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
      if (flushTimerRef.current) {
        clearInterval(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      bufferRef.current = [];
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [
    subscriptionEnabled,
    clusterName,
    namespace,
    podName,
    container,
    tailLines,
    timestamps,
    previous,
    trpc,
    flushBuffer,
  ]);

  // Reset on parameter change
  useEffect(() => {
    bufferRef.current = [];
    setSubscriptionError(null);
  }, [namespace, podName, container, clusterName, timestamps, follow]);

  const logs = follow ? "" : queryData?.logs || "";
  const isLoading = follow ? isSubscriptionLoading : queryLoading;
  const error = follow ? subscriptionError : queryError;

  return { logs, isLoading, error };
};
