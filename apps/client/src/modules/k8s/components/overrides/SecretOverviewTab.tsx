import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { ResourceOverviewTab } from "../ResourceOverviewTab";
import type { KubeObjectBase } from "@my-project/shared";

interface SecretLike extends KubeObjectBase {
  type?: string;
  data?: Record<string, string>;
}

export function SecretOverviewTab({ item }: { item: KubeObjectBase }) {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const secret = item as SecretLike;
  const data = secret.data ?? {};

  const decode = (v: string) => {
    try {
      return atob(v);
    } catch {
      return v;
    }
  };

  return (
    <div className="grid gap-4">
      <ResourceOverviewTab item={item} />
      <section>
        <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">Type</h3>
        <p className="mt-1 font-mono text-sm">{secret.type ?? "—"}</p>
      </section>
      <section>
        <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">Data</h3>
        <ul className="mt-2 space-y-1 text-sm">
          {Object.entries(data).length === 0 ? (
            <li className="text-muted-foreground">—</li>
          ) : (
            Object.entries(data).map(([k, v]) => (
              <li key={k} className="flex items-start gap-2">
                <span className="text-muted-foreground min-w-[8rem] font-mono">{k}:</span>
                <span className="flex-1 font-mono break-all">{revealed[k] ? decode(v) : "••••••••••••••••"}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRevealed((p) => ({ ...p, [k]: !p[k] }))}
                  aria-label={revealed[k] ? `Hide ${k}` : `Reveal ${k}`}
                >
                  {revealed[k] ? <EyeOff size={14} /> : <Eye size={14} />}
                </Button>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
