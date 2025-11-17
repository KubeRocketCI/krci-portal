import "@xterm/xterm/css/xterm.css";
import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from "react";
import { Input } from "@/core/components/ui/input";
import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
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
                <Button variant="ghost" size="icon" onClick={handleSearch} disabled={!content}>
                  <Search className="h-4 w-4" />
                </Button>
              </Tooltip>
            )}

            {enableDownload && (
              <Tooltip title="Download content">
                <Button variant="ghost" size="icon" onClick={handleDownload} disabled={!content}>
                  <Download className="h-4 w-4" />
                </Button>
              </Tooltip>
            )}

            {enableCopy && (
              <Tooltip title="Copy content">
                <Button variant="ghost" size="icon" onClick={handleCopy} disabled={!content}>
                  <Copy className="h-4 w-4" />
                </Button>
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
    <div className="absolute top-2 right-[15px] z-[1000] flex items-center gap-1 rounded border border-[#e0e0e0] bg-[#f5f5f5] p-2 shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
      {/* Search Input */}
      <Input
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search..."
        autoFocus
        className="focus:border-primary focus:ring-primary/20 w-[200px] rounded border border-gray-300 bg-white px-2 py-0.5 text-sm focus:ring-2 focus:outline-none"
      />

      {/* Search Options */}
      <Tooltip title="Case sensitive">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCaseSensitive(!caseSensitive)}
          className={caseSensitive ? "bg-blue-50 text-blue-600" : "text-gray-600"}
        >
          Aa
        </Button>
      </Tooltip>

      <Tooltip title="Whole word">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setWholeWord(!wholeWord)}
          className={wholeWord ? "bg-blue-50 text-blue-600" : "text-gray-600"}
        >
          Ab
        </Button>
      </Tooltip>

      <Tooltip title="Regular expression">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setRegex(!regex)}
          className={regex ? "bg-blue-50 text-blue-600" : "text-gray-600"}
        >
          .*
        </Button>
      </Tooltip>

      {/* Search Results */}
      <div className="min-w-20 text-center text-xs" style={{ color: getSearchResultColor() }}>
        {getSearchResultText()}
      </div>

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
