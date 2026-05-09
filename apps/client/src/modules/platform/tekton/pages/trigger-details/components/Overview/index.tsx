import { Link } from "@tanstack/react-router";
import { useShallow } from "zustand/react/shallow";
import { Card } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Button } from "@/core/components/ui/button";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { formatTimestamp } from "@/core/utils/date-humanize";
import { useClusterStore } from "@/k8s/store";
import { useTriggerWatch } from "../../hooks/data";
import { routeTriggerBindingDetails } from "@/modules/platform/tekton/pages/trigger-binding-details/route";
import { routeTriggerTemplateDetails } from "@/modules/platform/tekton/pages/trigger-template-details/route";
import { routeInterceptorDetails } from "@/modules/platform/tekton/pages/interceptor-details/route";
import { routeClusterInterceptorDetails } from "@/modules/platform/tekton/pages/cluster-interceptor-details/route";

export function Overview() {
  const watch = useTriggerWatch();
  const trigger = watch.query.data;
  const { clusterName, namespace: defaultNamespace } = useClusterStore(
    useShallow((s) => ({ clusterName: s.clusterName, namespace: s.defaultNamespace }))
  );

  return (
    <Card className="p-6">
      <LoadingWrapper isLoading={watch.isLoading || !trigger}>
        {trigger && (
          <div className="flex flex-col gap-6">
            <section>
              <h3 className="text-foreground mb-2 text-lg font-semibold">Metadata</h3>
              <dl className="grid grid-cols-4 gap-x-6 gap-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Created</dt>
                  <dd>{formatTimestamp(trigger.metadata.creationTimestamp)}</dd>
                </div>
                <div className="col-span-3">
                  <dt className="text-muted-foreground">Labels</dt>
                  <dd className="flex flex-wrap gap-1">
                    {(() => {
                      const labels = Object.entries(trigger.metadata.labels ?? {});
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
              <h3 className="text-foreground mb-2 text-lg font-semibold">Bindings</h3>
              <ul className="flex flex-col gap-2">
                {(trigger.spec?.bindings ?? []).map((b, i) => {
                  const kind = b.kind ?? "TriggerBinding";
                  const isResolvable = kind === "TriggerBinding" && !!b.ref;
                  return (
                    <li key={`${b.ref ?? "binding"}-${i}`} className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary">{kind}</Badge>
                      {isResolvable ? (
                        <Button variant="link" asChild className="h-auto p-0">
                          <Link
                            to={routeTriggerBindingDetails.fullPath}
                            params={{
                              clusterName,
                              namespace: trigger.metadata.namespace || defaultNamespace,
                              name: b.ref!,
                            }}
                          >
                            {b.ref}
                          </Link>
                        </Button>
                      ) : (
                        <span>{b.ref ?? "(unresolved)"}</span>
                      )}
                    </li>
                  );
                })}
                {!trigger.spec?.bindings?.length && <li className="text-muted-foreground text-sm">No bindings</li>}
              </ul>
            </section>

            <section>
              <h3 className="text-foreground mb-2 text-lg font-semibold">Template</h3>
              {(() => {
                const ref = trigger.spec?.template?.ref;
                if (!ref) return <span className="text-muted-foreground text-sm">No template</span>;
                return (
                  <Button variant="link" asChild className="h-auto p-0">
                    <Link
                      to={routeTriggerTemplateDetails.fullPath}
                      params={{ clusterName, namespace: trigger.metadata.namespace || defaultNamespace, name: ref }}
                    >
                      {ref}
                    </Link>
                  </Button>
                );
              })()}
            </section>

            <section>
              <h3 className="text-foreground mb-2 text-lg font-semibold">Interceptors</h3>
              <ul className="flex flex-col gap-3">
                {(trigger.spec?.interceptors ?? []).map((i, idx) => (
                  <li key={`${i.ref?.name ?? "interceptor"}-${idx}`} className="border-border rounded border p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="secondary">
                        {i.ref?.kind === "ClusterInterceptor" ? "Cluster" : "Namespaced"}
                      </Badge>
                      {i.ref?.name && i.ref?.kind === "ClusterInterceptor" && (
                        <Button variant="link" asChild className="h-auto p-0">
                          <Link to={routeClusterInterceptorDetails.fullPath} params={{ clusterName, name: i.ref.name }}>
                            {i.ref.name}
                          </Link>
                        </Button>
                      )}
                      {i.ref?.name && i.ref?.kind !== "ClusterInterceptor" && (
                        <Button variant="link" asChild className="h-auto p-0">
                          <Link
                            to={routeInterceptorDetails.fullPath}
                            params={{
                              clusterName,
                              namespace: trigger.metadata.namespace || defaultNamespace,
                              name: i.ref.name,
                            }}
                          >
                            {i.ref.name}
                          </Link>
                        </Button>
                      )}
                    </div>
                    <table className="w-full text-sm">
                      <tbody>
                        {(i.params ?? []).map((p) => (
                          <tr key={p.name}>
                            <td className="text-muted-foreground py-1 pr-4 align-top font-mono">{p.name}</td>
                            <td className="py-1">
                              <pre className="font-mono text-xs break-words whitespace-pre-wrap">
                                {typeof p.value === "string" ? p.value : JSON.stringify(p.value, null, 2)}
                              </pre>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </LoadingWrapper>
    </Card>
  );
}
