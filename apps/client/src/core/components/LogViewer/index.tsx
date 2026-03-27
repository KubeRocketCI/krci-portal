import React, { useRef, useImperativeHandle, forwardRef, useState } from "react";
import { LazyLog } from "@melloware/react-logviewer";
import { Card } from "@/core/components/ui/card";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { useTheme } from "@/core/hooks/useTheme";

export interface LogViewerProps {
  /** Log content for static mode (one-time render). Ignored when streaming=true. */
  content?: string;
  /** Enable streaming mode — use appendLines() via ref for incremental updates. */
  streaming?: boolean;
  /** Show loading overlay */
  isLoading?: boolean;
  /** Error message to display */
  error?: string;
  /** Custom controls to render above the log viewer */
  renderControls?: () => React.ReactNode;
  /** Loading message */
  loadingMessage?: string;
  /** Error message prefix */
  errorMessagePrefix?: string;
  /** Empty state message */
  emptyMessage?: string;
}

export interface LogViewerRef {
  appendLines: (lines: string[]) => void;
  clear: () => void;
}

/**
 * CSS styles for log viewer using CSS variables for theme support.
 * Uses the same font as Terminal component (IBM Plex Mono).
 * Colors adapt to light/dark theme via CSS variables defined in tailwind.css.
 */
const logViewerStyles = `
  .log-viewer-container {
    background: var(--card) !important;
    border: 1px solid var(--border);
    border-radius: 6px;
  }
  .log-viewer-container > div {
    background: var(--card) !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    border-top: 0 !important;
    border-left: 0 !important;
    border-right: 0 !important;
  }
  .log-viewer-container * {
    font-family: "IBM Plex Mono", monospace !important;
    font-size: 13px !important;
  }
  .log-viewer-line {
    color: var(--card-foreground) !important;
    background: transparent !important;
  }
  .log-viewer-line:hover {
    background: var(--muted) !important;
  }
  .log-viewer-highlight {
    background: var(--accent) !important;
  }
  /* Line numbers */
  .log-viewer-container .log-number {
    color: var(--muted-foreground) !important;
  }

  /* Search bar styling - match floating buttons */
  .react-lazylog-searchbar {
    background: var(--secondary) !important;
    border: 1px solid var(--border) !important;
    border-radius: 0.375rem !important;
    padding: 0.25rem !important;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
    display: flex !important;
    gap: 0.25rem !important;
    align-items: center !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  .react-lazylog-searchbar input {
    background: var(--background) !important;
    color: var(--foreground) !important;
    border: 1px solid var(--border) !important;
    border-radius: 0.375rem !important;
    padding: 0.25rem 0.5rem !important;
    font-size: 0.875rem !important;
    font-weight: 500 !important;
    min-height: 32px !important;
    outline: none !important;
    white-space: nowrap !important;
    flex: 1 !important;
  }

  .react-lazylog-searchbar input:focus-visible {
    outline: none !important;
    border-color: var(--ring) !important;
    box-shadow: 0 0 0 3px var(--ring) !important;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--ring) 50%, transparent) !important;
  }

  .react-lazylog-searchbar button {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 0.5rem !important;
    white-space: nowrap !important;
    border-radius: 0.375rem !important;
    font-size: 0.875rem !important;
    font-weight: 500 !important;
    background: var(--secondary) !important;
    color: var(--secondary-foreground) !important;
    border: none !important;
    padding: 0 !important;
    cursor: pointer !important;
    height: 32px !important;
    width: 32px !important;
    flex-shrink: 0 !important;
    outline: none !important;
    transition: background-color 0.2s !important;
  }

  .react-lazylog-searchbar button:hover {
    background: color-mix(in srgb, var(--secondary) 80%, transparent) !important;
  }

  .react-lazylog-searchbar button:focus-visible {
    outline: none !important;
    border-color: var(--ring) !important;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--ring) 50%, transparent) !important;
  }

  .react-lazylog-searchbar button:disabled {
    pointer-events: none !important;
    opacity: 0.5 !important;
  }
`;

const lazyLogProps = {
  enableSearch: true,
  enableHotKeys: true,
  caseInsensitive: true,
  enableLineNumbers: true,
  enableLinks: true,
  selectableLines: true,
  wrapLines: false,
  height: "auto" as const,
  rowHeight: 19,
  lineClassName: "log-viewer-line",
  highlightLineClassName: "log-viewer-highlight",
};

/**
 * LogViewer - Generic log viewer component
 *
 * Supports two modes:
 * - **Static** (default): Pass `content` string. Best for historical/completed logs.
 * - **Streaming** (`streaming={true}`): Use `appendLines()` via ref for incremental updates.
 *   Avoids full re-parse, O(delta) per update. Best for live/follow logs.
 */
export const LogViewer = forwardRef<LogViewerRef, LogViewerProps>(
  (
    {
      content,
      streaming = false,
      isLoading = false,
      error,
      renderControls,
      loadingMessage = "Loading logs...",
      errorMessagePrefix = "Failed to load logs",
      emptyMessage = "No logs available",
    },
    ref
  ) => {
    const theme = useTheme();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lazyLogRef = useRef<any>(null);
    const [hasStreamContent, setHasStreamContent] = useState(false);
    const hasStreamContentRef = useRef(false);

    useImperativeHandle(
      ref,
      () => ({
        appendLines: (lines: string[]) => {
          if (lines.length > 0) {
            if (!hasStreamContentRef.current) {
              hasStreamContentRef.current = true;
              setHasStreamContent(true);
            }
            lazyLogRef.current?.appendLines(lines);
          }
        },
        clear: () => {
          hasStreamContentRef.current = false;
          setHasStreamContent(false);
          lazyLogRef.current?.clear();
        },
      }),
      []
    );

    const hasContent = streaming ? hasStreamContent : !!content;
    const showOverlay = isLoading || !!error || !hasContent;

    return (
      <>
        <style>{logViewerStyles}</style>

        <div className="flex h-full min-h-0 flex-col gap-4">
          {/* Custom Controls */}
          {renderControls && <div>{renderControls()}</div>}

          {/* Log Viewer Card */}
          <Card className="relative flex min-h-0 min-h-[45svh] flex-1 flex-col overflow-hidden">
            {/* Overlay for loading/error/empty states */}
            {showOverlay && (
              <div className="bg-background/80 absolute inset-0 z-10 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  {isLoading && (
                    <>
                      <LoadingSpinner size={32} />
                      <span className="text-muted-foreground text-sm">{loadingMessage}</span>
                    </>
                  )}
                  {error && !isLoading && (
                    <div className="flex flex-col items-center gap-2 text-center">
                      <span className="text-destructive text-sm font-medium">{errorMessagePrefix}</span>
                      <span className="text-muted-foreground text-xs">{error}</span>
                    </div>
                  )}
                  {!isLoading && !error && !hasContent && (
                    <span className="text-muted-foreground text-sm">{emptyMessage}</span>
                  )}
                </div>
              </div>
            )}

            {/* LazyLog — streaming or static mode */}
            <div className="log-viewer-container min-h-0 flex-1">
              {streaming ? (
                <LazyLog key={`stream-${theme}`} ref={lazyLogRef} external follow extraLines={1} {...lazyLogProps} />
              ) : (
                hasContent && <LazyLog key={theme} text={content || ""} {...lazyLogProps} />
              )}
            </div>
          </Card>
        </div>
      </>
    );
  }
);

LogViewer.displayName = "LogViewer";

export default LogViewer;
