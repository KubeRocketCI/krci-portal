import React from "react";
import { LazyLog } from "@melloware/react-logviewer";
import { Copy, Download } from "lucide-react";
import { Card } from "@/core/components/ui/card";
import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { useTheme } from "@/core/hooks/useTheme";

export interface TektonResultsLogViewerProps {
  /** Log content - passed directly, preserved as-is with ANSI colors */
  content: string;
  /** Height of the component */
  height?: number;
  /** Show loading overlay */
  isLoading?: boolean;
  /** Error message to display */
  error?: string;
  /** Filename for download */
  downloadFilename?: string;
}

/**
 * CSS styles for log viewer using CSS variables for theme support.
 * Uses the same font as Terminal component (IBM Plex Mono).
 * Colors adapt to light/dark theme via CSS variables defined in tailwind.css.
 */
const logViewerStyles = `
  .tekton-log-container {
    background: var(--card) !important;
    border: 1px solid var(--border);
    border-radius: 6px;
  }
  .tekton-log-container > div {
    background: var(--card) !important;
  }
  .tekton-log-container * {
    font-family: "IBM Plex Mono", monospace !important;
    font-size: 13px !important;
  }
  .tekton-log-line {
    color: var(--card-foreground) !important;
    background: transparent !important;
  }
  .tekton-log-line:hover {
    background: var(--muted) !important;
  }
  .tekton-log-highlight {
    background: var(--accent) !important;
  }
  /* Line numbers */
  .tekton-log-container .log-number {
    color: var(--muted-foreground) !important;
  }
  /* Search input styling */
  .tekton-log-container input {
    background: var(--input) !important;
    color: var(--foreground) !important;
    border: 1px solid var(--border) !important;
  }
`;

/**
 * TektonResultsLogViewer - Log viewer for Tekton Results
 *
 * Uses @melloware/react-logviewer (LazyLog) which provides:
 * - Built-in search (Ctrl+F, Enter for next, Shift+Enter for previous)
 * - ANSI color support
 * - Virtualized rendering for large logs
 * - Line numbers
 * - Line selection
 */
const TOOLBAR_HEIGHT = 40;

export const TektonResultsLogViewer: React.FC<TektonResultsLogViewerProps> = ({
  content,
  height = 600,
  isLoading = false,
  error,
  downloadFilename = "logs.txt",
}) => {
  const theme = useTheme();
  const hasContent = !!content;
  const showOverlay = isLoading || !!error || !hasContent;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadFilename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <style>{logViewerStyles}</style>

      <Card className="relative flex flex-col overflow-hidden" style={{ height }}>
        {/* Toolbar */}
        <div className="border-border flex gap-1 border-b p-1" style={{ height: TOOLBAR_HEIGHT }}>
          <Tooltip title="Copy to clipboard">
            <Button variant="ghost" size="icon" onClick={handleCopy} disabled={!hasContent}>
              <Copy className="h-4 w-4" />
            </Button>
          </Tooltip>
          <Tooltip title="Download logs">
            <Button variant="ghost" size="icon" onClick={handleDownload} disabled={!hasContent}>
              <Download className="h-4 w-4" />
            </Button>
          </Tooltip>
        </div>

        {/* Overlay for loading/error/empty states */}
        {showOverlay && (
          <div className="bg-background/80 absolute inset-0 z-10 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              {isLoading && (
                <>
                  <LoadingSpinner size={32} />
                  <span className="text-muted-foreground text-sm">Loading logs...</span>
                </>
              )}
              {error && !isLoading && (
                <div className="flex flex-col items-center gap-2 text-center">
                  <span className="text-destructive text-sm font-medium">Failed to load logs</span>
                  <span className="text-muted-foreground text-xs">{error}</span>
                </div>
              )}
              {!isLoading && !error && !hasContent && (
                <span className="text-muted-foreground text-sm">No logs available</span>
              )}
            </div>
          </div>
        )}

        {/* LazyLog */}
        {hasContent && (
          <div className="tekton-log-container flex-1">
            <LazyLog
              key={theme}
              text={content}
              enableSearch
              enableHotKeys
              caseInsensitive
              enableLineNumbers
              enableLinks
              selectableLines
              wrapLines={false}
              height={height - TOOLBAR_HEIGHT}
              rowHeight={19}
              lineClassName="tekton-log-line"
              highlightLineClassName="tekton-log-highlight"
            />
          </div>
        )}
      </Card>
    </>
  );
};

export default TektonResultsLogViewer;
