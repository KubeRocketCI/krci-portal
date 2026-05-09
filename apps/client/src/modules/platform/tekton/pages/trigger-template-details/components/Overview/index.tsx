import { Card } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { formatTimestamp } from "@/core/utils/date-humanize";
import { classifyPipelineRef } from "@/modules/platform/tekton/hooks/useEventListenerTopology";
import { useTriggerTemplateWatch } from "../../hooks/data";

export const Overview = () => {
  const watch = useTriggerTemplateWatch();
  const tt = watch.query.data;

  return (
    <Card className="p-6">
      <LoadingWrapper isLoading={watch.isLoading || !tt}>
        {tt && (
          <div className="flex flex-col gap-6">
            <section>
              <h3 className="text-foreground mb-2 text-lg font-semibold">Metadata</h3>
              <dl className="grid grid-cols-4 gap-x-6 gap-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Created</dt>
                  <dd>{formatTimestamp(tt.metadata.creationTimestamp)}</dd>
                </div>
                <div className="col-span-3">
                  <dt className="text-muted-foreground">Labels</dt>
                  <dd className="flex flex-wrap gap-1">
                    {(() => {
                      const labels = Object.entries(tt.metadata.labels ?? {});
                      if (labels.length === 0) {
                        return <span className="text-muted-foreground">No labels</span>;
                      }
                      return labels.map(([k, v]) => (
                        <Badge key={k} variant="secondary">
                          {k}:{v}
                        </Badge>
                      ));
                    })()}
                  </dd>
                </div>
              </dl>
            </section>

            <section>
              <h3 className="text-foreground mb-2 text-lg font-semibold">Params</h3>
              {(() => {
                const params = tt.spec?.params ?? [];
                if (params.length === 0) {
                  return <p className="text-muted-foreground text-sm">No params declared.</p>;
                }
                return (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-muted-foreground border-b text-left">
                        <th className="py-2 pr-4 font-medium">Name</th>
                        <th className="py-2 pr-4 font-medium">Description</th>
                        <th className="py-2 font-medium">Default</th>
                      </tr>
                    </thead>
                    <tbody>
                      {params.map((p) => (
                        <tr key={p.name} className="border-b last:border-b-0">
                          <td className="py-2 pr-4 font-mono">{p.name}</td>
                          <td className="text-muted-foreground py-2 pr-4">{p.description ?? "—"}</td>
                          <td className="py-2 font-mono text-xs">
                            {p.default !== undefined ? (
                              <code>{p.default}</code>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </section>

            <section>
              <h3 className="text-foreground mb-2 text-lg font-semibold">Resource templates</h3>
              {(() => {
                const rts = tt.spec?.resourcetemplates ?? [];
                if (rts.length === 0) {
                  return <p className="text-muted-foreground text-sm">No resource templates defined.</p>;
                }
                return (
                  <ul className="flex flex-col gap-3">
                    {rts.map((rt, idx) => {
                      const cls = classifyPipelineRef(rt.spec?.pipelineRef?.name);
                      const rtKey = rt.metadata?.name ?? rt.metadata?.generateName ?? `rt-${idx}`;
                      return (
                        <li key={`${rtKey}-${idx}`} className="border-border rounded border p-3">
                          <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                            <span className="text-muted-foreground">apiVersion:</span>
                            <code className="font-mono text-xs">{rt.apiVersion ?? "—"}</code>
                            <span className="text-muted-foreground">kind:</span>
                            <code className="font-mono text-xs">{rt.kind ?? "—"}</code>
                            <span className="text-muted-foreground">name:</span>
                            <code className="font-mono text-xs">
                              {rt.metadata?.generateName ?? rt.metadata?.name ?? "—"}
                            </code>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="text-muted-foreground">pipelineRef:</span>
                            {cls.kind === "literal" && (
                              <Badge className="bg-primary/10 text-primary">{cls.pipelineName}</Badge>
                            )}
                            {cls.kind === "templated" && (
                              <>
                                <Badge variant="secondary">
                                  <code className="font-mono text-xs">{cls.raw}</code>
                                </Badge>
                                {cls.sourceParam && <Badge variant="outline">← param: {cls.sourceParam}</Badge>}
                              </>
                            )}
                            {cls.kind === "unknown" && <Badge variant="warning">unknown</Badge>}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                );
              })()}
            </section>
          </div>
        )}
      </LoadingWrapper>
    </Card>
  );
};
