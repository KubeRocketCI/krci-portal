import { useTRPCClient } from "@/core/providers/trpc";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef, useMemo } from "react";
import { usePodWatchItem } from "@/k8s/api/groups/Core/Pod";

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
}

interface UsePodLogsResult {
  logs: string;
  isLoading: boolean;
  error: Error | null;
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
}: UsePodLogsParams): UsePodLogsResult => {
  const trpc = useTRPCClient();
  const [accumulatedLogs, setAccumulatedLogs] = useState<string>("");
  const [subscriptionError, setSubscriptionError] = useState<Error | null>(null);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  // Watch the pod for real-time status updates
  const podWatch = usePodWatchItem({
    name: podName,
    namespace,
    queryOptions: {
      enabled: enabled && !!podName,
    },
  });

  const pod = podWatch.query.data;

  // Simple pod readiness check - try logs when pod exists
  const podReadyForLogs = useMemo(() => {
    if (!pod || !container) {
      return false;
    }

    // Try logs as soon as pod exists - let the API and retry logic handle failures
    return true;
  }, [pod, container]);

  // Query for initial logs (non-follow mode or initial fetch)
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
        follow: false, // Always false for query
        tailLines,
        timestamps,
        previous,
      }),
    enabled: enabled && !!podName && !!container && podReadyForLogs,
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      const errorMessage = error?.message || "";
      const isContainerNotReady =
        errorMessage.includes("container not created yet") ||
        errorMessage.includes("Error occurred in log request") ||
        errorMessage.includes("400") ||
        errorMessage.includes("404") ||
        errorMessage.includes("204");

      // Log only for debugging if needed
      // console.log("🔄 Query retry decision:", { failureCount, isContainerNotReady });

      if (isContainerNotReady && failureCount < 10) {
        return true; // Retry for container not ready errors
      }

      return failureCount < 3; // Standard retries for other errors
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff, max 5s
  });

  // Subscription for follow mode with retry logic
  useEffect(() => {
    const subscriptionEnabled = follow && enabled && !!podName && !!container && podReadyForLogs;

    if (!subscriptionEnabled) {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      return;
    }

    let retryCount = 0;
    const maxRetries = 10;
    let retryTimer: NodeJS.Timeout;

    const startSubscription = () => {
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
              setIsSubscriptionLoading(false);
              retryCount = 0; // Reset retry count on successful data
              if (data.type === "data" && data.logs) {
                setAccumulatedLogs((prev) => prev + data.logs);
              } else if (data.type === "end") {
                setIsSubscriptionLoading(false);
              }
            },
            onError: (error: unknown) => {
              setIsSubscriptionLoading(false);
              setSubscriptionError(error as Error);

              const errorMessage = (error as Error)?.message || "";
              const isContainerNotReady =
                errorMessage.includes("container not created yet") ||
                errorMessage.includes("Error occurred in log request") ||
                errorMessage.includes("400") ||
                errorMessage.includes("404") ||
                errorMessage.includes("204");

              // Retry logic for container not ready errors
              if (isContainerNotReady && retryCount < maxRetries) {
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

        // Retry on setup errors too
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
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [
    follow,
    enabled,
    clusterName,
    namespace,
    podName,
    container,
    tailLines,
    timestamps,
    previous,
    podReadyForLogs,
    trpc,
  ]);

  // Reset accumulated logs when parameters change
  useEffect(() => {
    setAccumulatedLogs("");
    setSubscriptionError(null);
  }, [namespace, podName, container, clusterName, timestamps]);

  // Determine which logs to return
  const logs = follow ? accumulatedLogs : queryData?.logs || "";
  const isLoading = follow ? isSubscriptionLoading : queryLoading;
  const error = follow ? subscriptionError : queryError;

  return {
    logs,
    isLoading,
    error,
  };
};
