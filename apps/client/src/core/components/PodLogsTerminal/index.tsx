import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { Label } from "@/core/components/ui/label";
import { Switch } from "@/core/components/ui/switch";
import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import { Copy, Download } from "lucide-react";
import { LogViewer, type LogViewerRef } from "@/core/components/LogViewer";
import { downloadTextFile, generateTimestampedLogFilename, sanitizeLogFilenamePart } from "@/core/utils/download";
import { Pod } from "@my-project/shared";
import { usePodLogs } from "./hooks/usePodLogs";

export interface PodLogsProps {
  clusterName: string;
  namespace: string;
  pods: Pod[];
  selectedContainer?: string;
  selectedPod?: string;
  height?: number;
  follow?: boolean;
  tailLines?: number;
  timestamps?: boolean;
  previous?: boolean;
}

// Legacy alias for backward compatibility
export type PodLogsTerminalProps = PodLogsProps;

const TIMESTAMP_REGEX = /\[\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.?\d*Z?)\]\]\s+/g;

function formatLogLine(line: string, showTimestamps: boolean): string {
  if (!showTimestamps) {
    return line.replace(TIMESTAMP_REGEX, "");
  }

  return line.replace(TIMESTAMP_REGEX, (_match, timestamp) => {
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
      return _match;
    }
  });
}

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

  const logViewerRef = useRef<LogViewerRef>(null);
  // Raw lines ref for copy/download in streaming mode
  const rawLinesRef = useRef<string[]>([]);
  const hasStreamContentRef = useRef(false);
  const [hasStreamContent, setHasStreamContent] = useState(false);

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
    return phase === "Running" || phase === "Succeeded" || phase === "Failed";
  }, [activePod?.metadata?.name, activePod?.status?.phase, activeContainer]);

  // Streaming callback — formats lines and appends to LogViewer incrementally
  const handleStreamLines = useCallback(
    (lines: string[]) => {
      rawLinesRef.current.push(...lines);
      if (!hasStreamContentRef.current) {
        hasStreamContentRef.current = true;
        setHasStreamContent(true);
      }
      const formatted = lines.map((line) => formatLogLine(line, logsTimestamps));
      logViewerRef.current?.appendLines(formatted);
    },
    [logsTimestamps]
  );

  // Clear LogViewer when parameters change (pod, container, timestamps toggle)
  const prevParamsRef = useRef({ podName: "", container: "", timestamps: true });
  useEffect(() => {
    const podName = activePod?.metadata?.name || "";
    const prev = prevParamsRef.current;
    if (prev.podName !== podName || prev.container !== activeContainer || prev.timestamps !== logsTimestamps) {
      const savedLines = rawLinesRef.current;
      logViewerRef.current?.clear();
      rawLinesRef.current = [];

      // If only timestamps changed and we have raw lines, re-append with new formatting
      if (prev.podName === podName && prev.container === activeContainer && prev.timestamps !== logsTimestamps) {
        if (savedLines.length > 0) {
          const reformatted = savedLines.map((line) => formatLogLine(line, logsTimestamps));
          logViewerRef.current?.appendLines(reformatted);
          rawLinesRef.current = savedLines;
        }
      } else {
        // Pod or container changed — reset stream content flag
        hasStreamContentRef.current = false;
        setHasStreamContent(false);
      }

      prevParamsRef.current = { podName, container: activeContainer, timestamps: logsTimestamps };
    }
  }, [activePod?.metadata?.name, activeContainer, logsTimestamps]);

  // Get logs using the hook
  const { logs, isLoading, error } = usePodLogs({
    clusterName,
    namespace,
    podName: activePod?.metadata?.name || "",
    container: activeContainer,
    follow,
    tailLines,
    timestamps: true,
    previous,
    enabled: podReadyForLogs,
    onStreamLines: follow ? handleStreamLines : undefined,
  });

  // Available containers - memoized
  const availableContainers = useMemo(() => {
    if (!activePod) return [];

    const containers: Array<{ name: string; type: string }> = [];

    if (activePod.spec?.initContainers) {
      containers.push(
        ...activePod.spec.initContainers.map((container: { name: string }) => ({
          name: container.name,
          type: "init",
        }))
      );
    }

    if (activePod.spec?.containers) {
      containers.push(
        ...activePod.spec.containers.map((container: { name: string }) => ({
          name: container.name,
          type: "container",
        }))
      );
    }

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

  // Format logs for static mode only
  const formattedLogs = useMemo(() => {
    if (!logs) return "";
    return formatLogLine(logs, logsTimestamps);
  }, [logs, logsTimestamps]);

  // Generate download filename
  const getDownloadFilename = useCallback(() => {
    const prefix = `${sanitizeLogFilenamePart(activePod?.metadata?.name || "pod")}-${sanitizeLogFilenamePart(activeContainer)}`;
    return generateTimestampedLogFilename(prefix);
  }, [activePod?.metadata?.name, activeContainer]);

  // Copy/download use raw lines ref in streaming mode, formatted string in static mode
  const getExportContent = useCallback(() => {
    if (follow && rawLinesRef.current.length > 0) {
      return rawLinesRef.current.map((line) => formatLogLine(line, logsTimestamps)).join("\n");
    }
    return formattedLogs;
  }, [follow, formattedLogs, logsTimestamps]);

  const handlePodChange = (value: string) => {
    setUserSelectedPodName(value);
    const pod = pods.find((p: Pod) => p.metadata?.name === value);
    if (pod?.spec?.containers?.length) {
      setActiveContainer(pod.spec.containers[0].name);
    }
  };

  const handleContainerChange = (value: string) => {
    setActiveContainer(value);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getExportContent());
  };

  const handleDownload = () => {
    downloadTextFile(getExportContent(), getDownloadFilename());
  };

  if (!pods.length) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-gray-500">No pods available</span>
      </div>
    );
  }

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

  const hasExportContent = follow ? hasStreamContent : !!formattedLogs;

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
          <Button variant="secondary" size="icon" onClick={handleCopy} disabled={!hasExportContent} className="h-8 w-8">
            <Copy className="h-4 w-4" />
          </Button>
        </Tooltip>
        <Tooltip title="Download logs">
          <Button
            variant="secondary"
            size="icon"
            onClick={handleDownload}
            disabled={!hasExportContent}
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
      ref={logViewerRef}
      streaming={follow}
      content={follow ? undefined : formattedLogs}
      isLoading={isLoading || !podReadyForLogs}
      error={getErrorMessage()}
      renderControls={renderControls}
      loadingMessage={getLoadingMessage()}
      errorMessagePrefix="Error loading logs"
      emptyMessage="No logs available"
    />
  );
};
