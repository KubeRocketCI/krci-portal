import React from "react";
import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import { Copy, Download } from "lucide-react";
import { LogViewer } from "@/core/components/LogViewer";

export interface TektonResultsLogViewerProps {
  /** Log content - passed directly, preserved as-is with ANSI colors */
  content: string;
  /** Show loading overlay */
  isLoading?: boolean;
  /** Error message to display */
  error?: string;
  /** Optional custom filename for download (without extension) */
  downloadFilename?: string;
}

/**
 * TektonResultsLogViewer - Log viewer for Tekton Results
 *
 * This is a wrapper around the generic LogViewer component.
 * Uses @melloware/react-logviewer (LazyLog) which provides:
 * - Built-in search (Ctrl+F, Enter for next, Shift+Enter for previous)
 * - ANSI color support
 * - Virtualized rendering for large logs
 * - Line numbers
 * - Line selection
 */
export const TektonResultsLogViewer: React.FC<TektonResultsLogViewerProps> = ({
  content,
  isLoading = false,
  error,
  downloadFilename,
}) => {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
  };

  const handleDownload = () => {
    let filename: string;

    if (downloadFilename) {
      filename =
        downloadFilename.endsWith(".txt") || downloadFilename.endsWith(".log")
          ? downloadFilename
          : `${downloadFilename}.log`;
    } else {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      filename = `tekton-logs-${timestamp}.log`;
    }

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderControls = () => (
    <div className="flex w-full items-end justify-end gap-1">
      <Tooltip title="Copy to clipboard">
        <Button variant="secondary" size="icon" onClick={handleCopy} disabled={!content} className="h-8 w-8">
          <Copy className="h-4 w-4" />
        </Button>
      </Tooltip>
      <Tooltip title="Download logs">
        <Button variant="secondary" size="icon" onClick={handleDownload} disabled={!content} className="h-8 w-8">
          <Download className="h-4 w-4" />
        </Button>
      </Tooltip>
    </div>
  );

  return <LogViewer content={content} isLoading={isLoading} error={error} renderControls={renderControls} />;
};

export default TektonResultsLogViewer;
