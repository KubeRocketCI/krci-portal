import { Card } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { formatTimestamp } from "@/core/utils/date-humanize";
import { useTriggerBindingWatch } from "../../hooks/data";

interface ParamSpec {
  name: string;
  value: unknown;
}

export const Overview = () => {
  const watch = useTriggerBindingWatch();
  const tb = watch.query.data;

  return (
    <Card className="p-6">
      <LoadingWrapper isLoading={watch.isLoading || !tb}>
        {tb && (
          <div className="flex flex-col gap-6">
            <section>
              <h3 className="text-foreground mb-2 text-lg font-semibold">Metadata</h3>
              <dl className="grid grid-cols-4 gap-x-6 gap-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Created</dt>
                  <dd>{formatTimestamp(tb.metadata.creationTimestamp)}</dd>
                </div>
                <div className="col-span-3">
                  <dt className="text-muted-foreground">Labels</dt>
                  <dd className="flex flex-wrap gap-1">
                    {(() => {
                      const labels = Object.entries(tb.metadata.labels ?? {});
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
              <h3 className="text-foreground mb-2 text-lg font-semibold">Param mapping</h3>
              {(() => {
                const params = (tb.spec?.params ?? []) as ParamSpec[];
                if (params.length === 0) {
                  return <p className="text-muted-foreground text-sm">No params declared.</p>;
                }
                return (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-muted-foreground border-b text-left">
                        <th className="py-2 pr-4 font-medium">Name</th>
                        <th className="py-2 font-medium">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {params.map((p) => (
                        <tr key={p.name} className="border-b last:border-b-0">
                          <td className="text-muted-foreground py-1 pr-4 align-top font-mono">{p.name}</td>
                          <td className="py-1 font-mono text-xs">
                            <code className="break-all">{String(p.value ?? "")}</code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </section>
          </div>
        )}
      </LoadingWrapper>
    </Card>
  );
};
