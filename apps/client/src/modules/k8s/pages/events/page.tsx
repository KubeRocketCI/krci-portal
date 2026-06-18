import { useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { useSearch } from "@tanstack/react-router";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { Button } from "@/core/components/ui/button";
import { Alert } from "@/core/components/ui/alert";
import { useK8sResourceListMulti } from "../../hooks/useK8sResourceListMulti";
import { useK8sWatchStatus } from "../../hooks/useK8sWatchStatus";
import { resolveListNamespaces } from "../../utils/resolveListNamespaces";
import { WatchConnectionIndicator } from "../../components/WatchConnectionIndicator";
import { k8sEventConfig, type KubeObjectBase } from "@my-project/shared";
import { EventStream } from "./components/EventStream";

interface K8sEventLike extends KubeObjectBase {
  type?: string;
}

type TypeFilter = "all" | "Normal" | "Warning";

export default function K8sEventsPage() {
  const search = useSearch({ strict: false }) as { namespace?: string };
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const namespaces = useMemo(() => resolveListNamespaces({ urlNamespace: search.namespace }), [search.namespace]);
  const result = useK8sResourceListMulti<K8sEventLike>(k8sEventConfig, { namespaces });
  const events = useMemo(() => result.data?.array ?? [], [result.data]);

  const filtered = useMemo(
    () => (typeFilter === "all" ? events : events.filter((e) => e.type === typeFilter)),
    [events, typeFilter]
  );

  const { errors, watchStatus } = useK8sWatchStatus(result.errors);

  return (
    <PageWrapper
      breadcrumbs={[{ label: "Cluster" }, { label: "Events" }]}
      headerSlot={<WatchConnectionIndicator status={watchStatus} />}
    >
      <PageContentWrapper icon={Bell} title="Events">
        <div className="flex items-center gap-2 border-b px-4 py-2">
          {(["all", "Normal", "Warning"] as const).map((t) => (
            <Button
              key={t}
              variant={typeFilter === t ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter(t)}
            >
              {t === "all" ? "All" : t}
            </Button>
          ))}
        </div>
        {errors.length > 0 && (
          <div className="px-4 pt-4">
            <Alert variant="destructive" title="Some namespaces could not be loaded">
              {errors.map((e, i) => (
                <div key={i}>{e.message}</div>
              ))}
            </Alert>
          </div>
        )}
        <EventStream events={filtered} />
      </PageContentWrapper>
    </PageWrapper>
  );
}
