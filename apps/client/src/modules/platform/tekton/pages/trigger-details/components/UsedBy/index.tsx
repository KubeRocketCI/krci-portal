import React from "react";
import { Link } from "@tanstack/react-router";
import { useShallow } from "zustand/react/shallow";
import { Card } from "@/core/components/ui/card";
import { Button } from "@/core/components/ui/button";
import { useClusterStore } from "@/k8s/store";
import { useEventListenerWatchList } from "@/k8s/api/groups/Tekton/EventListener";
import { useTriggerWatch } from "../../hooks/data";
import { routeEventListenerDetails } from "@/modules/platform/tekton/pages/event-listener-details/route";

export const UsedBy = () => {
  const watch = useTriggerWatch();
  const trigger = watch.query.data;
  const els = useEventListenerWatchList().data.array;
  const { clusterName, namespace: defaultNamespace } = useClusterStore(
    useShallow((s) => ({ clusterName: s.clusterName, namespace: s.defaultNamespace }))
  );

  const referencingEls = React.useMemo(() => {
    if (!trigger) return [];
    return els.filter((el) => {
      if (el.metadata.namespace !== trigger.metadata.namespace) return false;
      return (el.spec?.triggers ?? []).some((t) => t.triggerRef === trigger.metadata.name);
    });
  }, [els, trigger]);

  return (
    <Card className="p-6">
      <h3 className="text-foreground mb-3 text-lg font-semibold">Used by</h3>
      {referencingEls.length === 0 ? (
        <p className="text-muted-foreground text-sm">No EventListeners reference this Trigger.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {referencingEls.map((el) => (
            <li key={el.metadata.uid} className="text-sm">
              <Button variant="link" asChild className="h-auto p-0">
                <Link
                  to={routeEventListenerDetails.fullPath}
                  params={{ clusterName, namespace: el.metadata.namespace || defaultNamespace, name: el.metadata.name }}
                >
                  {el.metadata.name}
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};
