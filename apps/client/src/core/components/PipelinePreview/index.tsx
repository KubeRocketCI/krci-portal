import { Button } from "@/core/components/ui/button";
import { Copy, CopyCheck, Workflow } from "lucide-react";
import React from "react";
import { cn } from "@/core/utils/classname";

interface PipelinePreviewProps {
  pipelineName: string;
  namespace: string;
  onViewDiagram: (pipelineName: string, namespace: string) => void;
  className?: string;
}

export const PipelinePreview = ({ pipelineName, namespace, onViewDiagram, className }: PipelinePreviewProps) => {
  const [showCopied, setShowCopied] = React.useState<boolean>(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleClickCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(pipelineName);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setShowCopied(true);
    timeoutRef.current = setTimeout(() => {
      setShowCopied(false);
    }, 2000);
  };

  const handleViewDiagram = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewDiagram(pipelineName, namespace);
  };

  return (
    <div className={cn("bg-muted flex items-center justify-between rounded border pl-2", className)}>
      <div
        className="text-foreground relative overflow-x-auto overflow-y-hidden font-mono text-xs select-text"
        style={{
          scrollbarWidth: "none" as const,
          msOverflowStyle: "none",
        }}
      >
        <span className="block whitespace-nowrap">{pipelineName}</span>
      </div>
      <div className="flex items-center">
        <Button
          onClick={handleClickCopy}
          variant="ghost"
          size="sm"
          className="bg-muted hover:bg-muted/80 min-w-0 shrink-0 p-0"
        >
          {showCopied ? <CopyCheck size={12} /> : <Copy size={12} />}
        </Button>
        <Button variant="outline" size="sm" onClick={handleViewDiagram} className="shrink-0">
          <Workflow className="mr-1.5 h-3.5 w-3.5" />
          View Diagram
        </Button>
      </div>
    </div>
  );
};
