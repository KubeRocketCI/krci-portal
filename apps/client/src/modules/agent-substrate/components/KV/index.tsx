import type React from "react";
import { EmptyValue } from "../EmptyValue";

export function KV({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[minmax(9rem,max-content)_1fr] gap-x-4 gap-y-1.5 text-sm">
      {rows.map(([key, value]) => (
        <div key={key} className="contents">
          <dt className="text-muted-foreground">{key}</dt>
          <dd className="min-w-0 break-all">
            {value === null || value === undefined || value === "" ? <EmptyValue /> : value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
