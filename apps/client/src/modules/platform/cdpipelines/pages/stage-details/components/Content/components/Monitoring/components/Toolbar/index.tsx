import * as React from "react";
import { Clock, RefreshCw, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { Switch } from "@/core/components/ui/switch";
import { Label } from "@/core/components/ui/label";
import type { ToolbarProps } from "../../types";
import { RANGE_OPTIONS } from "../../constants";

function formatTimestamp(t: number): string {
  return new Date(t * 1000).toLocaleTimeString();
}

export const Toolbar: React.FC<ToolbarProps> = ({
  range,
  onRangeChange,
  autoRefresh,
  onAutoRefreshChange,
  lastUpdatedAt,
  isStale,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
      <div className="flex items-center gap-2">
        <Clock className="text-muted-foreground size-4" />
        <Select value={range} onValueChange={(v) => onRangeChange(v as ToolbarProps["range"])}>
          <SelectTrigger className="w-44" aria-label="Select time range">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="text-muted-foreground flex items-center gap-3 text-xs">
        {lastUpdatedAt !== undefined && (
          <span className="flex items-center gap-1">
            {isStale && <AlertTriangle className="size-3.5 text-amber-500" aria-label="Refresh failed" />}
            Last updated {formatTimestamp(lastUpdatedAt)}
          </span>
        )}
        <Label className="flex items-center gap-2">
          <RefreshCw className="size-3.5" />
          <span>Auto-refresh</span>
          <Switch checked={autoRefresh} onCheckedChange={onAutoRefreshChange} aria-label="Toggle auto-refresh" />
        </Label>
      </div>
    </div>
  );
};
