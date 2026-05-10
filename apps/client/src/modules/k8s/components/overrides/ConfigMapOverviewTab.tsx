import { Editor } from "@monaco-editor/react";
import { ResourceOverviewTab } from "../ResourceOverviewTab";
import type { KubeObjectBase } from "@my-project/shared";

interface ConfigMapLike extends KubeObjectBase {
  data?: Record<string, string>;
}

export function ConfigMapOverviewTab({ item }: { item: KubeObjectBase }) {
  const cm = item as ConfigMapLike;
  const data = cm.data ?? {};

  return (
    <div className="grid gap-4">
      <ResourceOverviewTab item={item} />
      <section>
        <h3 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">Data</h3>
        {Object.entries(data).length === 0 ? (
          <p className="text-muted-foreground mt-1 text-sm">—</p>
        ) : (
          <div className="mt-2 space-y-2">
            {Object.entries(data).map(([k, v]) => (
              <details key={k} className="bg-muted/30 rounded border">
                <summary className="cursor-pointer px-3 py-2 font-mono text-sm">{k}</summary>
                <div className="border-t">
                  <Editor
                    language="yaml"
                    theme="vs-light"
                    value={v}
                    height="240px"
                    options={{ readOnly: true, minimap: { enabled: false } }}
                  />
                </div>
              </details>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
