import React, { useState, useMemo, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { Label } from "@/core/components/ui/label";
import { Switch } from "@/core/components/ui/switch";
import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import { Copy, Download } from "lucide-react";
import { LogViewer } from "@/core/components/LogViewer";
import { downloadTextFile } from "@/core/utils/download";
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
  // State management for user-controllable values only
  const [userSelectedPodName, setUserSelectedPodName] = useState<string | undefined>(selectedPod);
  const [activeContainer, setActiveContainer] = useState<string>(selectedContainer || "");
  const [logsTimestamps, setLogsTimestamps] = useState(timestamps);

  // Derive activePod from pods prop - this ensures it updates when pod watch updates
  const activePod = useMemo(() => {
    const podName = userSelectedPodName || selectedPod;
    if (podName) {
      return pods.find((pod: Pod) => pod.metadata?.name === podName) || pods[0];
    }
    return pods[0];
  }, [pods, userSelectedPodName, selectedPod]);

  // Auto-select container when needed
  useEffect(() => {
    if (selectedContainer) {
      setActiveContainer(selectedContainer);
    } else if (activePod?.spec?.containers?.length && !activeContainer) {
      setActiveContainer(activePod.spec.containers[0].name);
    }
  }, [selectedContainer, activePod, activeContainer]);

  // Check if pod is ready for log fetching
  const podReadyForLogs = useMemo(() => {
    if (!activePod?.metadata?.name || !activeContainer) return false;

    const phase = activePod.status?.phase;
    // Pod is ready if it's running, succeeded, or failed (logs might be available)
    return phase === "Running" || phase === "Succeeded" || phase === "Failed";
  }, [activePod?.metadata?.name, activePod?.status?.phase, activeContainer]);

  // Get logs using the hook
  const { logs, isLoading, error } = usePodLogs({
    clusterName,
    namespace,
    podName: activePod?.metadata?.name || "",
    container: activeContainer,
    follow,
    tailLines,
    timestamps: logsTimestamps,
    previous,
    enabled: podReadyForLogs,
  });

  // Available containers - memoized
  const availableContainers = useMemo(() => {
    if (!activePod) return [];

    const containers: Array<{ name: string; type: string }> = [];

    // Add init containers
    if (activePod.spec?.initContainers) {
      containers.push(
        ...activePod.spec.initContainers.map((container: { name: string }) => ({
          name: container.name,
          type: "init",
        }))
      );
    }

    // Add main containers
    if (activePod.spec?.containers) {
      containers.push(
        ...activePod.spec.containers.map((container: { name: string }) => ({
          name: container.name,
          type: "container",
        }))
      );
    }

    // Add ephemeral containers
    if (activePod.spec?.ephemeralContainers) {
      containers.push(
        ...activePod.spec.ephemeralContainers.map((container: { name: string }) => ({
          name: container.name,
          type: "ephemeral",
        }))
      );
    }

    return containers;
  }, [activePod]);

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
    const podName = sanitizeName(activePod?.metadata?.name || "pod");
    const containerName = sanitizeName(activeContainer);
    return `${podName}-${containerName}-${timestamp}.log`;
  }, [activePod?.metadata?.name, activeContainer]);

  // Event handlers
  const handlePodChange = (value: string) => {
    setUserSelectedPodName(value);
    const pod = pods.find((p: Pod) => p.metadata?.name === value);
    // Reset container selection when pod changes
    if (pod?.spec?.containers?.length) {
      setActiveContainer(pod.spec.containers[0].name);
    }
  };

  const handleContainerChange = (value: string) => {
    setActiveContainer(value);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formattedLogs);
  };

  const handleDownload = () => {
    downloadTextFile(formattedLogs, downloadFilename);
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
  function getPhaseDetails(phase: string | undefined): string {
    switch (phase) {
      case "Pending":
        return " (Container is being scheduled)";
      case "ContainerCreating":
        return " (Container is starting up)";
      case undefined:
        return " (Initializing)";
      default:
        return "";
    }
  }

  function getLoadingMessage(): string {
    if (isLoading && podReadyForLogs) {
      return `Loading logs from ${activeContainer} container...`;
    }

    if (!podReadyForLogs && !error) {
      const phase = activePod?.status?.phase;
      return `Pod is getting ready...${getPhaseDetails(phase)}`;
    }

    return "Loading logs...";
  }

  function getErrorMessage(): string | undefined {
    if (!error) {
      return undefined;
    }
    const errorText = error instanceof Error ? error.message : String(error);
    return `${errorText}. Will retry automatically when the container is ready.`;
  }

  const renderControls = () => (
    <div className="flex w-full items-end justify-between gap-4">
      <div className="flex flex-wrap items-end gap-4">
        {pods.length > 1 && (
          <div className="flex min-w-[180px] flex-col gap-1.5">
            <Label htmlFor="pod-select">Pod</Label>
            <Select value={activePod?.metadata?.name || ""} onValueChange={handlePodChange}>
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
