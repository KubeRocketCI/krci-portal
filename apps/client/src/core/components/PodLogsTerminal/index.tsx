import React, { useState, useRef, useMemo } from "react";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip,
  Paper,
  InputBase,
} from "@mui/material";
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
  const handlePodChange = (event: { target: { value: string } }) => {
    const pod = pods.find((p: Pod) => p.metadata?.name === event.target.value);
    if (pod) {
      setActivePod(pod);
      // Reset container selection
      if (pod.spec?.containers?.length) {
        setActiveContainer(pod.spec.containers[0].name);
      }
    }
  };

  const handleContainerChange = (event: { target: { value: string } }) => {
    setActiveContainer(event.target.value);
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
      <div className="flex gap-8 items-center flex-wrap">
        {pods.length > 1 && (
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Pod</InputLabel>
            <Select value={currentPod?.metadata?.name || ""} label="Pod" onChange={handlePodChange}>
              {pods.map((pod: Pod) => (
                <MenuItem key={pod.metadata?.name} value={pod.metadata?.name || ""}>
                  {pod.metadata?.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Container</InputLabel>
          <Select value={activeContainer} label="Container" onChange={handleContainerChange}>
            {availableContainers.map((container) => (
              <MenuItem key={container.name} value={container.name}>
                {container.name} {container.type !== "container" && <em>({container.type})</em>}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Tail Lines"
          type="text"
          size="small"
          value={logsTailLines === -1 ? "all" : logsTailLines}
          onChange={handleTailLinesChange}
          placeholder="100 or 'all'"
          sx={{ width: 140 }}
        />

        <FormControlLabel
          control={<Switch size="small" checked={logsFollow} onChange={(e) => setLogsFollow(e.target.checked)} />}
          label="Follow"
        />

        <FormControlLabel
          control={
            <Switch size="small" checked={logsTimestamps} onChange={(e) => setLogsTimestamps(e.target.checked)} />
          }
          label="Timestamps"
        />

        {/* Action Buttons */}
        <div className="flex gap-1">
          <Tooltip title="Search logs (Ctrl+F)">
            <IconButton size="small" onClick={handleSearch} disabled={!formattedLogs}>
              <Search className="h-4 w-4" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Download logs">
            <IconButton size="small" onClick={handleDownload} disabled={!formattedLogs}>
              <Download className="h-4 w-4" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Copy logs">
            <IconButton size="small" onClick={handleCopy} disabled={!formattedLogs}>
              <Copy className="h-4 w-4" />
            </IconButton>
          </Tooltip>
        </div>

        {currentPod && (
          <span className="text-xs text-gray-500 ml-1">
            Pod: {currentPod.status?.phase || "Unknown"} | Ready: {podReadyForLogs ? "✅" : "⏳"} | Containers:{" "}
            {currentPod.spec?.containers?.length || 0} | Created:{" "}
            {currentPod.metadata?.creationTimestamp
              ? new Date(currentPod.metadata.creationTimestamp).toLocaleTimeString()
              : "Unknown"}
          </span>
        )}
      </div>

      {/* Logs Display */}
      <div className="flex-1 overflow-hidden relative">
        {/* Status Messages */}
        {(isLoading || !podReadyForLogs || error) && (
          <div
            className="absolute top-0 left-0 right-0 bg-white border-b border-gray-300 z-10"
            style={{
              padding: "6px", // 1.5 * 4 = 6px
              height: errorHeight,
            }}
          >
            {!podReadyForLogs && !error && (
              <span className="text-blue-600 text-xs">
                🚀 Pod is getting ready...
                {currentPod?.status?.phase === "Pending" && " (Container is being scheduled)"}
                {currentPod?.status?.phase === "ContainerCreating" && " (Container is starting up)"}
                {!currentPod?.status?.phase && " (Initializing)"}
                <span className="block mt-1 text-gray-500">
                  Logs will be available once the container is running
                </span>
              </span>
            )}

            {isLoading && podReadyForLogs && (
              <span className="text-blue-600 text-xs">
                📦 Loading logs from {activeContainer} container...
              </span>
            )}

            {error && (
              <span className="text-red-600 text-xs">
                ❌ Error loading logs:{" "}
                {typeof error === "object" && error !== null && "message" in error
                  ? (error as Error).message
                  : String(error)}
                <span className="block mt-1 text-gray-500">
                  Will retry automatically when the container is ready
                </span>
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
    <Paper
      sx={{
        position: "absolute",
        top: 8,
        right: 15,
        padding: "8px 12px",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: 1,
        backgroundColor: "#f5f5f5",
        border: "1px solid #e0e0e0",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      }}
    >
      {/* Search Input */}
      <InputBase
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search logs..."
        autoFocus
        sx={{
          width: 200,
          backgroundColor: "#fff",
          border: "1px solid #ccc",
          borderRadius: 1,
          padding: "2px 8px",
          fontSize: "14px",
          "&.Mui-focused": {
            borderColor: "#1976d2",
          },
        }}
      />

      {/* Search Options */}
      <Tooltip title="Case sensitive">
        <IconButton
          size="small"
          onClick={() => setCaseSensitive(!caseSensitive)}
          sx={{
            color: caseSensitive ? "#1976d2" : "#666",
            backgroundColor: caseSensitive ? "#e3f2fd" : "transparent",
          }}
        >
          Aa
        </IconButton>
      </Tooltip>

      <Tooltip title="Whole word">
        <IconButton
          size="small"
          onClick={() => setWholeWord(!wholeWord)}
          sx={{
            color: wholeWord ? "#1976d2" : "#666",
            backgroundColor: wholeWord ? "#e3f2fd" : "transparent",
          }}
        >
          Ab
        </IconButton>
      </Tooltip>

      <Tooltip title="Regular expression">
        <IconButton
          size="small"
          onClick={() => setRegex(!regex)}
          sx={{
            color: regex ? "#1976d2" : "#666",
            backgroundColor: regex ? "#e3f2fd" : "transparent",
          }}
        >
          .*
        </IconButton>
      </Tooltip>

      {/* Search Results */}
      <span className={`text-xs text-center min-w-20 ${getSearchResultColor()}`}>
        {getSearchResultText()}
      </span>

      {/* Navigation */}
      <Tooltip title="Previous (Shift+Enter)">
        <IconButton
          size="small"
          onClick={handleFindPrevious}
          disabled={!searchText || !searchResult || searchResult.resultCount === 0}
        >
          <ChevronUp className="h-4 w-4" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Next (Enter)">
        <IconButton
          size="small"
          onClick={handleFindNext}
          disabled={!searchText || !searchResult || searchResult.resultCount === 0}
        >
          <ChevronDown className="h-4 w-4" />
        </IconButton>
      </Tooltip>

      {/* Close */}
      <Tooltip title="Close (Esc)">
        <IconButton size="small" onClick={onClose}>
          <X className="h-4 w-4" />
        </IconButton>
      </Tooltip>
    </Paper>
  );
};
