import React, { useState, useRef, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { Label } from "@/core/components/ui/label";
import { Input } from "@/core/components/ui/input";
import { Switch } from "@/core/components/ui/switch";
import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import { Search, Download, Copy, ChevronUp, ChevronDown, X } from "lucide-react";

import { Terminal } from "@/core/components/Terminal";
import { TerminalRef } from "@/core/components/Terminal/types";
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
  height = 600,
}) => {
  // State management
  const [activePod, setActivePod] = useState<Pod | undefined>(() => {
    if (selectedPod) {
      return pods.find((pod: Pod) => pod.metadata?.name === selectedPod) || pods[0];
    }
    return pods[0];
  });

  const [activeContainer, setActiveContainer] = useState<string>(selectedContainer || "");
  const [logsFollow, setLogsFollow] = useState(follow);
  const [logsTailLines, setLogsTailLines] = useState(tailLines);
  const [logsTimestamps, setLogsTimestamps] = useState(timestamps);
  const [logsPrevious] = useState(previous);
  const [showSearch, setShowSearch] = useState(false);

  // Terminal ref
  const terminalRef = useRef<TerminalRef>(null);

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
    follow: logsFollow,
    tailLines: logsTailLines,
    timestamps: logsTimestamps,
    previous: logsPrevious,
    enabled: podReadyForLogs,
  });

  // Available containers - memoized
  const availableContainers = useMemo(() => {
    if (!currentPod) return [];

    const containers: Array<{ name: string; type: string }> = [];

    // Add init containers
    if (currentPod.spec?.initContainers) {
      containers.push(
        ...currentPod.spec.initContainers.map((container) => ({
          name: container.name,
          type: "init",
        }))
      );
    }

    // Add main containers
    if (currentPod.spec?.containers) {
      containers.push(
        ...currentPod.spec.containers.map((container) => ({
          name: container.name,
          type: "container",
        }))
      );
    }

    // Add ephemeral containers
    if (currentPod.spec?.ephemeralContainers) {
      containers.push(
        ...currentPod.spec.ephemeralContainers.map((container) => ({
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

  // Action handlers
  const handleSearch = () => {
    setShowSearch(!showSearch);
  };

  const handleDownload = () => {
    const terminal = terminalRef.current?.getTerminal();
    if (!terminal) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    // Sanitize filename to prevent potential XSS/injection issues
    const sanitizeName = (name: string) => name.replace(/[^a-zA-Z0-9\-_]/g, "_");
    const podName = sanitizeName(currentPod?.metadata?.name || "pod");
    const containerName = sanitizeName(activeContainer);
    const filename = `${podName}-${containerName}-${timestamp}.log`;

    const buffer = terminal.buffer.active;
    let allContent = "";
    for (let i = 0; i < buffer.length; i++) {
      const line = buffer.getLine(i);
      if (line) {
        allContent += line.translateToString(true) + "\n";
      }
    }

    const blob = new Blob([allContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    const terminal = terminalRef.current?.getTerminal();
    if (!terminal) return;

    try {
      const buffer = terminal.buffer.active;
      let allContent = "";
      for (let i = 0; i < buffer.length; i++) {
        const line = buffer.getLine(i);
        if (line) {
          allContent += line.translateToString(true) + "\n";
        }
      }

      await navigator.clipboard.writeText(allContent);
    } catch (err) {
      console.error("Failed to copy logs:", err);
    }
  };

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

  const handleTailLinesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || value === "all" || !isNaN(Number(value))) {
      setLogsTailLines(value === "all" ? -1 : parseInt(value) || 100);
    }
  };

  // Handle search keyboard shortcuts
  const handleTerminalKeyDown = (e: KeyboardEvent) => {
    // Handle Ctrl+F for search
    if (e.ctrlKey && e.key === "f" && e.type === "keydown") {
      e.preventDefault();
      setShowSearch(true);
      return false;
    }
    return true;
  };

  // Early return if no pods
  if (!pods.length) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <span className="text-gray-500">No pods available</span>
      </div>
    );
  }

  // Calculate error container height for proper padding
  const errorHeight = isLoading || !podReadyForLogs || error ? 50 : 0;

  return (
    <div className="flex flex-col gap-8" style={{ height }}>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-8">
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

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tail-lines-input">Tail Lines</Label>
          <Input
            id="tail-lines-input"
            type="text"
            value={logsTailLines === -1 ? "all" : logsTailLines}
            onChange={handleTailLinesChange}
            placeholder="100 or 'all'"
            className="h-9 w-[140px]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Switch checked={logsFollow} onCheckedChange={setLogsFollow} id="follow-switch" />
          <Label htmlFor="follow-switch" className="cursor-pointer">
            Follow
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch checked={logsTimestamps} onCheckedChange={setLogsTimestamps} id="timestamps-switch" />
          <Label htmlFor="timestamps-switch" className="cursor-pointer">
            Timestamps
          </Label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1">
          <Tooltip title="Search logs (Ctrl+F)">
            <Button variant="ghost" size="icon" onClick={handleSearch} disabled={!formattedLogs}>
              <Search className="h-4 w-4" />
            </Button>
          </Tooltip>

          <Tooltip title="Download logs">
            <Button variant="ghost" size="icon" onClick={handleDownload} disabled={!formattedLogs}>
              <Download className="h-4 w-4" />
            </Button>
          </Tooltip>

          <Tooltip title="Copy logs">
            <Button variant="ghost" size="icon" onClick={handleCopy} disabled={!formattedLogs}>
              <Copy className="h-4 w-4" />
            </Button>
          </Tooltip>
        </div>

        {currentPod && (
          <span className="ml-1 text-xs text-gray-500">
            Pod: {currentPod.status?.phase || "Unknown"} | Ready: {podReadyForLogs ? "✅" : "⏳"} | Containers:{" "}
            {currentPod.spec?.containers?.length || 0} | Created:{" "}
            {currentPod.metadata?.creationTimestamp
              ? new Date(currentPod.metadata.creationTimestamp).toLocaleTimeString()
              : "Unknown"}
          </span>
        )}
      </div>

      {/* Logs Display */}
      <div className="relative flex-1 overflow-hidden">
        {/* Status Messages */}
        {(isLoading || !podReadyForLogs || error) && (
          <div
            className="absolute top-0 right-0 left-0 z-10 border-b border-gray-300 bg-white"
            style={{
              padding: "6px", // 1.5 * 4 = 6px
              height: errorHeight,
            }}
          >
            {!podReadyForLogs && !error && (
              <span className="text-xs text-blue-600">
                🚀 Pod is getting ready...
                {currentPod?.status?.phase === "Pending" && " (Container is being scheduled)"}
                {currentPod?.status?.phase === "ContainerCreating" && " (Container is starting up)"}
                {!currentPod?.status?.phase && " (Initializing)"}
                <span className="mt-1 block text-gray-500">Logs will be available once the container is running</span>
              </span>
            )}

            {isLoading && podReadyForLogs && (
              <span className="text-xs text-blue-600">📦 Loading logs from {activeContainer} container...</span>
            )}

            {error && (
              <span className="text-xs text-red-600">
                ❌ Error loading logs:{" "}
                {typeof error === "object" && error !== null && "message" in error
                  ? (error as Error).message
                  : String(error)}
                <span className="mt-1 block text-gray-500">Will retry automatically when the container is ready</span>
              </span>
            )}
          </div>
        )}

        {/* Terminal Display */}
        <Terminal
          ref={terminalRef}
          content={formattedLogs}
          height={height - 120 - errorHeight} // Account for controls and status height
          enableSearch={true}
          readonly={true}
          onKeyDown={handleTerminalKeyDown}
          style={{
            paddingTop: errorHeight,
          }}
        />

        {/* Search Overlay */}
        <SearchPopover open={showSearch} onClose={() => setShowSearch(false)} terminalRef={terminalRef} />
      </div>
    </div>
  );
};

// Search Popover Component
interface SearchPopoverProps {
  open: boolean;
  onClose: () => void;
  terminalRef: React.RefObject<TerminalRef | null>;
}

const SearchPopover: React.FC<SearchPopoverProps> = ({ open, onClose, terminalRef }) => {
  const [searchText, setSearchText] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [regex, setRegex] = useState(false);
  const [searchResult, setSearchResult] = useState<{ resultIndex: number; resultCount: number } | undefined>();

  const searchOptions = React.useMemo(
    () => ({
      caseSensitive,
      wholeWord,
      regex,
      decorations: {
        matchBackground: "#ffeb3b",
        activeMatchBackground: "#ff9800",
        matchOverviewRuler: "#ffeb3b",
        activeMatchColorOverviewRuler: "#ff9800",
      },
    }),
    [caseSensitive, wholeWord, regex]
  );

  // Setup search result listener
  React.useEffect(() => {
    if (!open || !terminalRef.current) {
      return;
    }

    const searchAddon = terminalRef.current.getSearchAddon();
    if (!searchAddon) return;

    // Clear previous search state when opening
    setSearchResult(undefined);
    setSearchText("");

    // Set up result listener
    const disposable = searchAddon.onDidChangeResults?.((result) => {
      setSearchResult(result);
    });

    return () => {
      searchAddon.clearDecorations?.();
      searchAddon.clearActiveDecoration?.();
      disposable?.dispose?.();
    };
  }, [open, terminalRef]);

  // Perform search when text or options change
  React.useEffect(() => {
    if (!open || !terminalRef.current) {
      return;
    }

    const searchAddon = terminalRef.current.getSearchAddon();
    if (!searchAddon) return;

    if (!searchText) {
      // Clear search when no text
      searchAddon.clearDecorations?.();
      searchAddon.clearActiveDecoration?.();
      setSearchResult(undefined);
      return;
    }

    // Debounce search for better performance
    const timeoutId = setTimeout(() => {
      try {
        // Clear previous decorations first
        searchAddon.clearDecorations?.();
        searchAddon.clearActiveDecoration?.();

        // Perform new search - this should trigger onDidChangeResults
        searchAddon.findNext(searchText, searchOptions);
      } catch {
        // For API errors, try search without decorations
        try {
          const simpleOptions = { caseSensitive, wholeWord, regex };
          searchAddon.findNext(searchText, simpleOptions);
        } catch {
          setSearchResult({ resultIndex: 0, resultCount: 0 });
        }
      }
    }, 150); // 150ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchText, caseSensitive, wholeWord, regex, open, terminalRef, searchOptions]);

  const handleFindNext = () => {
    const searchAddon = terminalRef.current?.getSearchAddon();
    if (searchAddon && searchText) {
      searchAddon.findNext(searchText, searchOptions);
    }
  };

  const handleFindPrevious = () => {
    const searchAddon = terminalRef.current?.getSearchAddon();
    if (searchAddon && searchText) {
      searchAddon.findPrevious(searchText, searchOptions);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      if (event.shiftKey) {
        handleFindPrevious();
      } else {
        handleFindNext();
      }
    } else if (event.key === "Escape") {
      onClose();
    }
  };

  const getSearchResultText = () => {
    if (!searchText) return "Enter search term";
    if (searchResult === undefined) return "Searching...";
    if (searchResult.resultCount === 0) return "No results";
    return `${searchResult.resultIndex + 1} of ${searchResult.resultCount}`;
  };

  const getSearchResultColor = () => {
    if (!searchText) return "#999"; // Gray for placeholder
    if (searchResult === undefined) return "#1976d2"; // Blue for searching
    if (searchResult.resultCount === 0) return "#f44336"; // Red for no results
    return "#666"; // Gray for normal results
  };

  if (!open) return null;

  return (
    <div className="absolute top-2 right-[15px] z-[1000] flex items-center gap-1 rounded border border-[#e0e0e0] bg-[#f5f5f5] p-2 shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
      {/* Search Input */}
      <Input
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search logs..."
        autoFocus
        className="focus:border-primary focus:ring-primary/20 w-[200px] rounded border border-gray-300 bg-white px-2 py-0.5 text-sm focus:ring-2 focus:outline-none"
      />

      {/* Search Options */}
      <Tooltip title="Case sensitive">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCaseSensitive(!caseSensitive)}
          className={`h-8 w-8 ${caseSensitive ? "text-primary bg-primary/10" : "text-gray-600"}`}
        >
          Aa
        </Button>
      </Tooltip>

      <Tooltip title="Whole word">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setWholeWord(!wholeWord)}
          className={`h-8 w-8 ${wholeWord ? "text-primary bg-primary/10" : "text-gray-600"}`}
        >
          Ab
        </Button>
      </Tooltip>

      <Tooltip title="Regular expression">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setRegex(!regex)}
          className={`h-8 w-8 ${regex ? "text-primary bg-primary/10" : "text-gray-600"}`}
        >
          .*
        </Button>
      </Tooltip>

      {/* Search Results */}
      <span style={{ color: getSearchResultColor() }} className="min-w-20 text-center text-xs">
        {getSearchResultText()}
      </span>

      {/* Navigation */}
      <Tooltip title="Previous (Shift+Enter)">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleFindPrevious}
          disabled={!searchText || !searchResult || searchResult.resultCount === 0}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
      </Tooltip>

      <Tooltip title="Next (Enter)">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleFindNext}
          disabled={!searchText || !searchResult || searchResult.resultCount === 0}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </Tooltip>

      {/* Close */}
      <Tooltip title="Close (Esc)">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </Tooltip>
    </div>
  );
};
