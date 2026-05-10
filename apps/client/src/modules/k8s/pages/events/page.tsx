import { useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { useSearch } from "@tanstack/react-router";
import { PageContentWrapper } from "@/core/components/PageContentWrapper";
import { PageWrapper } from "@/core/components/PageWrapper";
import { Button } from "@/core/components/ui/button";
import { ErrorContent } from "@/core/components/ErrorContent";
import { useK8sResourceList } from "../../hooks/useK8sResourceList";
import { WatchConnectionIndicator, type WatchStatus } from "../../components/WatchConnectionIndicator";
import { useClusterStore } from "@/k8s/store";
import { k8sEventConfig, type KubeObjectBase } from "@my-project/shared";
import { EventStream } from "./components/EventStream";

interface K8sEventLike extends KubeObjectBase {
  type?: string;
}

type TypeFilter = "all" | "Normal" | "Warning";

export default function K8sEventsPage() {
  const search = useSearch({ strict: false }) as { namespace?: string };
  const stored = useClusterStore((s) => s.defaultNamespace);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const namespace = search.namespace ?? stored ?? "";
  const result = useK8sResourceList<K8sEventLike>(k8sEventConfig, namespace);
  const events = useMemo(() => result.data?.array ?? [], [result.data]);

  const filtered = useMemo(
    () => (typeFilter === "all" ? events : events.filter((e) => e.type === typeFilter)),
    [events, typeFilter]
  );

  const watchStatus: WatchStatus = result.error ? "error" : "connected";

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
        {result.error ? (
          <div className="p-4">
            <ErrorContent error={result.error} />
          </div>
        ) : (
          <EventStream events={filtered} />
        )}
      </PageContentWrapper>
    </PageWrapper>
  );
}
