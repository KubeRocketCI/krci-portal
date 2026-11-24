import type React from "react";
import { Info } from "lucide-react";
import { Tooltip } from "@/core/components/ui/tooltip";
import { EmptyValue } from "../EmptyValue";

interface TermHintProps {
  label: string;
  hint: string;
}

export function TermHint({ label, hint }: TermHintProps) {
  return (
    <Tooltip title={hint}>
      <button
        type="button"
        aria-label={`About ${label}`}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex shrink-0 rounded-sm focus-visible:ring-2 focus-visible:outline-none"
      >
        <Info size={14} aria-hidden />
      </button>
    </Tooltip>
  );
}

export function TermLabel({ label, hint }: TermHintProps) {
  return (
    <span className="inline-flex items-center gap-1">
      {label}
      <TermHint label={label} hint={hint} />
    </span>
  );
}

/** Key, value and an optional term hint of the key. An empty value shows as `EmptyValue`. */
export type KVRow = [key: string, value: React.ReactNode, hint?: string];

export function KV({ rows }: { rows: KVRow[] }) {
  return (
    <dl className="grid grid-cols-[minmax(9rem,max-content)_1fr] gap-x-4 gap-y-1.5 text-sm">
      {rows.map(([key, value, hint]) => (
        <div key={key} className="contents">
          <dt className="text-muted-foreground flex items-center gap-1">
            {key}
            {hint && <TermHint label={key} hint={hint} />}
          </dt>
          <dd className="min-w-0 break-all">
            {value === null || value === undefined || value === "" ? <EmptyValue /> : value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
