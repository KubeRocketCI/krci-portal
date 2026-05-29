import React, { useRef, useImperativeHandle, forwardRef, useState, useCallback, useEffect } from "react";
import { LazyLog } from "@melloware/react-logviewer";
import { ArrowDownToLine, ArrowUpToLine } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { Card } from "@/core/components/ui/card";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { Tooltip } from "@/core/components/ui/tooltip";
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
  /**
   * Custom controls rendered at the LEFT of the toolbar row, before the
   * built-in controls (font size + scroll-to-top/bottom). Use for inputs that
   * select what is shown, e.g. a container/pod selector or a timestamps toggle.
   */
  renderLeftControls?: () => React.ReactNode;
  /**
   * Custom controls rendered RIGHT-aligned in the toolbar row, after a flexible
   * spacer. Use for actions like copy / download.
   */
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
    font-size: var(--log-font-size, 11px) !important;
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

/** Compact secondary icon button used for the scroll-to-top/bottom controls. */
function ScrollButton({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <Tooltip title={label}>
      <Button variant="secondary" size="icon" onClick={onClick} aria-label={label} className="h-8 w-8">
        {icon}
      </Button>
    </Tooltip>
  );
}

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
      renderLeftControls,
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
    const [fontSize, setFontSize] = useState(11);
    // In streaming mode LazyLog's `follow` keeps the view pinned to the latest
    // line. Jumping to the top pauses it (so it doesn't get yanked back on the
    // next append); jumping to the bottom resumes it.
    const [isFollowing, setIsFollowing] = useState(true);

    /** virtua list handle exposed by LazyLog: scrollTo(offset)/scrollSize.
     * `listRef` is a LazyLog implementation detail, so guard defensively against
     * a future library version changing or removing it. */
    const getScrollHandle = useCallback(() => {
      const handle = lazyLogRef.current?.listRef?.current as
        | { scrollTo: (o: number) => void; scrollSize: number }
        | undefined;
      return typeof handle?.scrollTo === "function" && typeof handle.scrollSize === "number" ? handle : undefined;
    }, []);

    // The streaming LazyLog `key` includes the theme, so a theme switch remounts
    // it as a fresh, bottom-following instance. Mirror that by resuming follow —
    // otherwise a prior "scroll to top" (which paused follow) would leave the
    // remounted stream frozen at the top.
    useEffect(() => {
      setIsFollowing(true);
    }, [theme]);

    const scrollToTop = useCallback(() => {
      // Only pause follow once there is content to pause on. The scroll
      // controls stay visible in streaming mode even during the initial
      // loading overlay (to avoid flicker on clear/repopulate); pausing here
      // before the first line arrives would leave the stream frozen at the top
      // once it starts, with follow silently disabled for the whole session.
      if (streaming && hasStreamContent) {
        setIsFollowing(false);
      }
      getScrollHandle()?.scrollTo(0);
    }, [streaming, hasStreamContent, getScrollHandle]);

    const scrollToBottom = useCallback(() => {
      if (streaming) {
        setIsFollowing(true);
      }
      const handle = getScrollHandle();
      handle?.scrollTo(handle.scrollSize);
    }, [streaming, getScrollHandle]);

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
          // Resume auto-follow for the fresh stream — otherwise a prior
          // "scroll to top" (which paused follow) would leave the new stream
          // (e.g. after switching container) frozen at the top.
          setIsFollowing(true);
          lazyLogRef.current?.clear();
        },
      }),
      []
    );

    const hasContent = streaming ? hasStreamContent : !!content;
    const showOverlay = isLoading || !!error || !hasContent;
    // In streaming mode the LazyLog instance stays mounted across reloads
    // (e.g. switching container), so keep the scroll controls visible to avoid
    // them flickering each time the stream is cleared and re-populated.
    const showScrollControls = streaming || hasContent;

    const fontSizeSelector = (
      <div className="flex flex-shrink-0 items-center gap-2">
        <span className="text-muted-foreground text-xs">Font size</span>
        <Select value={String(fontSize)} onValueChange={(v: string) => setFontSize(Number(v))}>
          <SelectTrigger className="h-8 w-20 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[8, 9, 10, 11, 12, 13, 14].map((size) => (
              <SelectItem key={size} value={String(size)} className="text-xs">
                {size}px
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );

    // Built-in controls: font size + scroll-to-top/bottom, grouped together
    // (kept clear of LazyLog's own search-match navigation).
    const builtInControls = (
      <div className="flex flex-shrink-0 items-center gap-3">
        {fontSizeSelector}
        {showScrollControls && (
          <div className="flex items-center gap-1">
            <ScrollButton label="Scroll to top" icon={<ArrowUpToLine className="h-4 w-4" />} onClick={scrollToTop} />
            <ScrollButton
              label="Scroll to bottom"
              icon={<ArrowDownToLine className="h-4 w-4" />}
              onClick={scrollToBottom}
            />
          </div>
        )}
      </div>
    );

    return (
      <>
        <style>{logViewerStyles}</style>

        <div className="flex h-full min-h-0 flex-col gap-4 pt-1">
          {(hasContent || streaming || renderControls || renderLeftControls) && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              {renderLeftControls && renderLeftControls()}
              {builtInControls}
              {renderControls && <div className="ml-auto flex-shrink-0">{renderControls()}</div>}
            </div>
          )}

          {/* Log Viewer Card */}
          <Card
            className="relative flex min-h-[45svh] flex-1 flex-col overflow-hidden"
            style={{ "--log-font-size": `${fontSize}px` } as React.CSSProperties}
          >
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
                <LazyLog
                  key={`stream-${theme}`}
                  ref={lazyLogRef}
                  external
                  follow={isFollowing}
                  extraLines={1}
                  {...lazyLogProps}
                />
              ) : (
                hasContent && <LazyLog key={theme} ref={lazyLogRef} text={content || ""} {...lazyLogProps} />
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
