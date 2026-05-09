import React from "react";
import { Link } from "@tanstack/react-router";
import { useShallow } from "zustand/react/shallow";
import { Card } from "@/core/components/ui/card";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import { useClusterStore } from "@/k8s/store";
import { useTriggerWatchListMultiple } from "@/k8s/api/groups/Tekton/Trigger";
import { useEventListenerWatchListMultiple } from "@/k8s/api/groups/Tekton/EventListener";
import { useClusterInterceptorWatch } from "../../hooks/data";
import { routeTriggerDetails } from "@/modules/platform/tekton/pages/trigger-details/route";
import { routeEventListenerDetails } from "@/modules/platform/tekton/pages/event-listener-details/route";

export const UsedBy = () => {
  const watch = useClusterInterceptorWatch();
  const ci = watch.query.data;
  const triggers = useTriggerWatchListMultiple().data.array;
  const els = useEventListenerWatchListMultiple().data.array;
  const { clusterName, namespace: defaultNamespace } = useClusterStore(
    useShallow((s) => ({ clusterName: s.clusterName, namespace: s.defaultNamespace }))
  );

  const matches = (ref: { name?: string; kind?: string } | undefined, name: string) =>
    ref?.name === name && ref?.kind === "ClusterInterceptor";

  const referencingTriggers = React.useMemo(() => {
    if (!ci) return [];
    return triggers.filter((t) => (t.spec?.interceptors ?? []).some((i) => matches(i.ref, ci.metadata.name)));
  }, [triggers, ci]);

  const referencingEls = React.useMemo(() => {
    if (!ci) return [];
    return els.filter((el) =>
      (el.spec?.triggers ?? []).some((entry) =>
        (entry.interceptors ?? []).some((i) => matches(i.ref, ci.metadata.name))
      )
    );
  }, [els, ci]);

  return (
    <Card className="p-6">
      <h3 className="text-foreground mb-3 text-lg font-semibold">Used by</h3>
      {referencingTriggers.length === 0 && referencingEls.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No Triggers or EventListeners reference this ClusterInterceptor.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {referencingTriggers.length > 0 && (
            <div>
              <h4 className="text-muted-foreground mb-2 text-xs uppercase">Triggers</h4>
              <ul className="flex flex-col gap-2">
                {referencingTriggers.map((t) => (
                  <li key={t.metadata.uid} className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary">{t.metadata.namespace}</Badge>
                    <Button variant="link" asChild className="h-auto p-0">
                      <Link
                        to={routeTriggerDetails.fullPath}
                        params={{
                          clusterName,
                          namespace: t.metadata.namespace || defaultNamespace,
                          name: t.metadata.name,
                        }}
                      >
                        {t.metadata.name}
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {referencingEls.length > 0 && (
            <div>
              <h4 className="text-muted-foreground mb-2 text-xs uppercase">EventListeners (inline)</h4>
              <ul className="flex flex-col gap-2">
                {referencingEls.map((el) => (
                  <li key={el.metadata.uid} className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary">{el.metadata.namespace}</Badge>
                    <Button variant="link" asChild className="h-auto p-0">
                      <Link
                        to={routeEventListenerDetails.fullPath}
                        params={{
                          clusterName,
                          namespace: el.metadata.namespace || defaultNamespace,
                          name: el.metadata.name,
                        }}
                      >
                        {el.metadata.name}
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
