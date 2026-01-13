import React, { useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { Label } from "@/core/components/ui/label";
import { Switch } from "@/core/components/ui/switch";
import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import { Copy, Download } from "lucide-react";
import { LogViewer } from "@/core/components/LogViewer";
import { Pod } from "@my-project/shared";
import { usePodLogs } from "./hooks/usePodLogs";

export interface PodLogsProps {
  clusterName: string;
  namespace: string;
  pods: Pod[];
  selectedContainer?: string;
  selectedPod?: string; // Optional pod name to select
  height?: number;
  follow?: boolean;
  tailLines?: number;
  timestamps?: boolean;
  previous?: boolean;
  enableDebugLogs?: boolean; // Optional flag to enable debug console logs
}

// Legacy alias for backward compatibility
export type PodLogsTerminalProps = PodLogsProps;

export const PodLogsTerminal: React.FC<PodLogsProps> = ({
  clusterName,
  namespace,
  pods = [],
  selectedPod,
  selectedContainer,
  tailLines = 100,
  follow = true,
  timestamps = true,
  previous = false,
}) => {
  // State management
  const [activePod, setActivePod] = useState<Pod | undefined>(() => {
    if (selectedPod) {
      return pods.find((pod: Pod) => pod.metadata?.name === selectedPod) || pods[0];
    }
    return pods[0];
  });

  const [activeContainer, setActiveContainer] = useState<string>(selectedContainer || "");
  const [logsTimestamps, setLogsTimestamps] = useState(timestamps);

  const currentPod = activePod;

  // Check if pod is ready for log fetching
  const podReadyForLogs = useMemo(() => {
    if (!currentPod?.metadata?.name || !activeContainer) return false;

    const phase = currentPod.status?.phase;
    // Pod is ready if it's running, succeeded, or failed (logs might be available)
    return phase === "Running" || phase === "Succeeded" || phase === "Failed";
  }, [currentPod?.metadata?.name, currentPod?.status?.phase, activeContainer]);

  // Get logs using the hook
  const { logs, isLoading, error } = usePodLogs({
    clusterName,
    namespace,
    podName: currentPod?.metadata?.name || "",
    container: activeContainer,
    follow: follow,
    tailLines: tailLines,
    timestamps: logsTimestamps,
    previous: previous,
    enabled: podReadyForLogs,
  });

  // Available containers - memoized
  const availableContainers = useMemo(() => {
    if (!currentPod) return [];

    const containers: Array<{ name: string; type: string }> = [];

    // Add init containers
    if (currentPod.spec?.initContainers) {
      containers.push(
        ...currentPod.spec.initContainers.map((container: { name: string }) => ({
          name: container.name,
          type: "init",
        }))
      );
    }

    // Add main containers
    if (currentPod.spec?.containers) {
      containers.push(
        ...currentPod.spec.containers.map((container: { name: string }) => ({
          name: container.name,
          type: "container",
        }))
      );
    }

    // Add ephemeral containers
    if (currentPod.spec?.ephemeralContainers) {
      containers.push(
        ...currentPod.spec.ephemeralContainers.map((container: { name: string }) => ({
          name: container.name,
          type: "ephemeral",
        }))
      );
    }

    return containers;
  }, [currentPod]);

  // Format logs
  const formattedLogs = useMemo(() => {
    if (!logs) return "";

    const formatLogLine = (logLine: string): string => {
      if (!logsTimestamps) {
        return logLine.replace(/\[\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.?\d*Z?)\]\]\s+/gm, "");
      }

      return logLine.replace(/\[\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.?\d*Z?)\]\]\s+/gm, (match, timestamp) => {
        try {
          const date = new Date(timestamp);
          const localeTime = date.toLocaleString(undefined, {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          });
          return `[ ${localeTime} ] `;
        } catch {
          return match;
        }
      });
    };

    return formatLogLine(logs);
  }, [logs, logsTimestamps]);

  // Generate download filename
  const downloadFilename = useMemo(() => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const sanitizeName = (name: string) => name.replace(/[^a-zA-Z0-9\-_]/g, "_");
    const podName = sanitizeName(currentPod?.metadata?.name || "pod");
    const containerName = sanitizeName(activeContainer);
    return `${podName}-${containerName}-${timestamp}.log`;
  }, [currentPod?.metadata?.name, activeContainer]);

  // Event handlers
  const handlePodChange = (value: string) => {
    const pod = pods.find((p: Pod) => p.metadata?.name === value);
    if (pod) {
      setActivePod(pod);
      // Reset container selection
      if (pod.spec?.containers?.length) {
        setActiveContainer(pod.spec.containers[0].name);
      }
    }
  };

  const handleContainerChange = (value: string) => {
    setActiveContainer(value);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formattedLogs);
  };

  const handleDownload = () => {
    const blob = new Blob([formattedLogs], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadFilename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Early return if no pods
  if (!pods.length) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-gray-500">No pods available</span>
      </div>
    );
  }

  // Determine loading state and error message
  const getLoadingMessage = () => {
    if (!podReadyForLogs && !error) {
      let message = "Pod is getting ready...";
      if (currentPod?.status?.phase === "Pending") {
        message += " (Container is being scheduled)";
      } else if (currentPod?.status?.phase === "ContainerCreating") {
        message += " (Container is starting up)";
      } else if (!currentPod?.status?.phase) {
        message += " (Initializing)";
      }
      return message;
    }
    if (isLoading && podReadyForLogs) {
      return `Loading logs from ${activeContainer} container...`;
    }
    return "Loading logs...";
  };

  const getErrorMessage = () => {
    if (!error) return undefined;
    const errorText =
      typeof error === "object" && error !== null && "message" in error ? (error as Error).message : String(error);
    return `${errorText}. Will retry automatically when the container is ready.`;
  };

  const renderControls = () => (
    <div className="flex w-full items-end justify-between gap-4">
      <div className="flex flex-wrap items-end gap-4">
        {pods.length > 1 && (
          <div className="flex min-w-[180px] flex-col gap-1.5">
            <Label htmlFor="pod-select">Pod</Label>
            <Select value={currentPod?.metadata?.name || ""} onValueChange={handlePodChange}>
              <SelectTrigger id="pod-select" className="h-9">
                <SelectValue placeholder="Select pod" />
              </SelectTrigger>
              <SelectContent>
                {pods.map((pod: Pod) => (
                  <SelectItem key={pod.metadata?.name} value={pod.metadata?.name || ""}>
                    {pod.metadata?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex min-w-[200px] flex-col gap-1.5">
          <Label htmlFor="container-select">Container</Label>
          <Select value={activeContainer} onValueChange={handleContainerChange}>
            <SelectTrigger id="container-select" className="h-9">
              <SelectValue placeholder="Select container" />
            </SelectTrigger>
            <SelectContent>
              {availableContainers.map((container) => (
                <SelectItem key={container.name} value={container.name}>
                  {container.name} {container.type !== "container" && <em>({container.type})</em>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 pb-1">
          <Switch checked={logsTimestamps} onCheckedChange={setLogsTimestamps} id="timestamps-switch" />
          <Label htmlFor="timestamps-switch" className="cursor-pointer text-sm">
            Timestamps
          </Label>
        </div>
      </div>

      <div className="flex gap-1 pb-1">
        <Tooltip title="Copy to clipboard">
          <Button variant="secondary" size="icon" onClick={handleCopy} disabled={!formattedLogs} className="h-8 w-8">
            <Copy className="h-4 w-4" />
          </Button>
        </Tooltip>
        <Tooltip title="Download logs">
          <Button
            variant="secondary"
            size="icon"
            onClick={handleDownload}
            disabled={!formattedLogs}
            className="h-8 w-8"
          >
            <Download className="h-4 w-4" />
          </Button>
        </Tooltip>
      </div>
    </div>
  );

  return (
    <LogViewer
      content={formattedLogs}
      isLoading={isLoading || !podReadyForLogs}
      error={getErrorMessage()}
      renderControls={renderControls}
      loadingMessage={getLoadingMessage()}
      errorMessagePrefix="Error loading logs"
      emptyMessage="No logs available"
    />
  );
};
