import "@xterm/xterm/css/xterm.css";
import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from "react";
import { IconButton, Tooltip, Paper, InputBase } from "@mui/material";
import { Search, Download, Copy, ChevronUp, ChevronDown, X } from "lucide-react";
import { Terminal as XTerminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { SearchAddon } from "@xterm/addon-search";
import { WebLinksAddon } from "@xterm/addon-web-links";

import { TerminalProps, TerminalRef, TerminalTheme } from "./types";

const defaultTheme: TerminalTheme = {
  background: "#ffffff",
  foreground: "#1a1a1a",
  cursor: "#1a1a1a",
  selectionBackground: "#d0d0d0",
  selectionForeground: "#000000",
  black: "#000000",
  red: "#d32f2f",
  green: "#2e7d32",
  yellow: "#f57f17",
  blue: "#1976d2",
  magenta: "#7b1fa2",
  cyan: "#0097a7",
  white: "#ffffff",
  brightBlack: "#666666",
  brightRed: "#f44336",
  brightGreen: "#4caf50",
  brightYellow: "#ffeb3b",
  brightBlue: "#2196f3",
  brightMagenta: "#9c27b0",
  brightCyan: "#00bcd4",
  brightWhite: "#fafafa",
};

export const Terminal = forwardRef<TerminalRef, TerminalProps>(
  (
    {
      content,
      height = 600,
      enableSearch = false,
      enableWebLinks = true,
      theme = defaultTheme,
      options = {},
      onData,
      onResize,
      onKeyDown,
      className,
      style,
      readonly = false,
      enableDownload = false,
      enableCopy = false,
      downloadFilename,
      showToolbar = false,
    },
    ref
  ) => {
    const [showSearch, setShowSearch] = useState(false);
    const terminalRef = useRef<{
      terminal: XTerminal;
      fitAddon: FitAddon;
      searchAddon?: SearchAddon;
      webLinksAddon?: WebLinksAddon;
      containerElement: HTMLDivElement;
    } | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);

    // Initialize terminal
    const initializeTerminal = (containerElement: HTMLDivElement) => {
      if (terminalRef.current) {
        terminalRef.current.terminal.dispose();
      }

      const terminal = new XTerminal({
        allowProposedApi: true,
        theme: { ...defaultTheme, ...theme },
        cursorBlink: !readonly,
        disableStdin: readonly,
        scrollback: 10000,
        fontSize: 12,
        fontFamily: "IBM Plex Mono, monospace",
        lineHeight: 1.26,
        ...options,
      });

      const fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);

      let searchAddon: SearchAddon | undefined;
      if (enableSearch) {
        searchAddon = new SearchAddon();
        terminal.loadAddon(searchAddon);
      }

      let webLinksAddon: WebLinksAddon | undefined;
      if (enableWebLinks) {
        webLinksAddon = new WebLinksAddon();
        terminal.loadAddon(webLinksAddon);
      }

      terminal.open(containerElement);
      fitAddon.fit();

      // Setup event handlers
      if (onData) {
        terminal.onData(onData);
      }

      if (onResize) {
        terminal.onResize(onResize);
      }

      // Setup keyboard shortcuts
      terminal.attachCustomKeyEventHandler((e) => {
        // Handle custom key events
        const shouldContinue = handleTerminalKeyDown(e);
        if (!shouldContinue) {
          return false;
        }

        // Allow selection and copy/paste operations
        if (e.ctrlKey && (e.key === "c" || e.key === "a" || e.key === "v")) {
          return false; // Allow default browser behavior
        }

        return true;
      });

      terminalRef.current = {
        terminal,
        fitAddon,
        searchAddon,
        webLinksAddon,
        containerElement,
      };

      // Handle window resize
      const handleResize = () => fitAddon.fit();
      window.addEventListener("resize", handleResize);

      return () => {
        terminal.dispose();
        window.removeEventListener("resize", handleResize);
      };
    };

    // Update terminal content when content changes
    useEffect(() => {
      const terminalInstance = terminalRef.current;
      if (!terminalInstance || !content) return;

      const { terminal } = terminalInstance;
      terminal.clear();

      const lines = content.split("\n");
      lines.forEach((line: string, index: number) => {
        if (line.trim() || index < lines.length - 1) {
          terminal.writeln(line);
        }
      });

      terminal.scrollToBottom();
    }, [content]);

    // Action handlers
    const handleSearch = () => {
      setShowSearch(!showSearch);
    };

    const handleDownload = () => {
      const terminal = terminalRef.current?.terminal;
      if (!terminal) return;

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = downloadFilename || `terminal-content-${timestamp}.log`;

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
      const terminal = terminalRef.current?.terminal;
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
        console.error("Failed to copy content:", err);
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

      // Call custom onKeyDown if provided
      if (onKeyDown) {
        return onKeyDown(e);
      }

      return true;
    };

    // Expose terminal methods via ref
    useImperativeHandle(
      ref,
      () => ({
        getTerminal: () => terminalRef.current?.terminal || null,
        getFitAddon: () => terminalRef.current?.fitAddon || null,
        getSearchAddon: () => terminalRef.current?.searchAddon || null,
        getWebLinksAddon: () => terminalRef.current?.webLinksAddon || null,
        clear: () => terminalRef.current?.terminal.clear(),
        write: (data: string) => terminalRef.current?.terminal.write(data),
        writeln: (data: string) => terminalRef.current?.terminal.writeln(data),
        scrollToBottom: () => terminalRef.current?.terminal.scrollToBottom(),
        fit: () => terminalRef.current?.fitAddon.fit(),
        focus: () => terminalRef.current?.terminal.focus(),
        selectAll: () => terminalRef.current?.terminal.selectAll(),
        getSelection: () => terminalRef.current?.terminal.getSelection() || "",
        clearSelection: () => terminalRef.current?.terminal.clearSelection(),
      }),
      []
    );

    return (
      <div
        className={`relative flex flex-col overflow-hidden rounded border border-gray-300 ${className || ""}`}
        style={{ height, backgroundColor: theme?.background || "#ffffff", ...style }}
      >
        {/* Toolbar */}
        {showToolbar && (
          <div className="flex gap-1 border-b border-gray-300 p-1">
            {enableSearch && (
              <Tooltip title="Search (Ctrl+F)">
                <IconButton size="small" onClick={handleSearch} disabled={!content}>
                  <Search className="h-4 w-4" />
                </IconButton>
              </Tooltip>
            )}

            {enableDownload && (
              <Tooltip title="Download content">
                <IconButton size="small" onClick={handleDownload} disabled={!content}>
                  <Download className="h-4 w-4" />
                </IconButton>
              </Tooltip>
            )}

            {enableCopy && (
              <Tooltip title="Copy content">
                <IconButton size="small" onClick={handleCopy} disabled={!content}>
                  <Copy className="h-4 w-4" />
                </IconButton>
              </Tooltip>
            )}
          </div>
        )}

        {/* Terminal Display */}
        <div
          ref={(element) => {
            if (element && !terminalRef.current) {
              containerRef.current = element;
              initializeTerminal(element);
            }
          }}
          className="w-full"
          style={{
            height: showToolbar ? "calc(100% - 48px)" : "100%",
          }}
        />

        {/* Search Overlay */}
        {enableSearch && (
          <SearchPopover
            open={showSearch}
            onClose={() => setShowSearch(false)}
            terminalRef={
              terminalRef as React.RefObject<{
                terminal: XTerminal;
                fitAddon: FitAddon;
                searchAddon?: SearchAddon;
                webLinksAddon?: WebLinksAddon;
                containerElement: HTMLDivElement;
              }>
            }
          />
        )}
      </div>
    );
  }
);

Terminal.displayName = "Terminal";

// Search Popover Component
interface SearchPopoverProps {
  open: boolean;
  onClose: () => void;
  terminalRef: React.RefObject<{
    terminal: XTerminal;
    fitAddon: FitAddon;
    searchAddon?: SearchAddon;
    webLinksAddon?: WebLinksAddon;
    containerElement: HTMLDivElement;
  }>;
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

    const searchAddon = terminalRef.current.searchAddon;
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

    const searchAddon = terminalRef.current.searchAddon;
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
    const searchAddon = terminalRef.current?.searchAddon;
    if (searchAddon && searchText) {
      searchAddon.findNext(searchText, searchOptions);
    }
  };

  const handleFindPrevious = () => {
    const searchAddon = terminalRef.current?.searchAddon;
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
        placeholder="Search..."
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
      <div className="min-w-20 text-center text-xs" style={{ color: getSearchResultColor() }}>
        {getSearchResultText()}
      </div>

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
