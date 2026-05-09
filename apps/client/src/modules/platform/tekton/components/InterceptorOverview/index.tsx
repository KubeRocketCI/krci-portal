import React from "react";
import { Interceptor, ClusterInterceptor } from "@my-project/shared";
import { Card } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import { formatTimestamp } from "@/core/utils/date-humanize";

export interface InterceptorOverviewProps {
  resource: Interceptor | ClusterInterceptor | null | undefined;
  isLoading: boolean;
}

export const InterceptorOverview: React.FC<InterceptorOverviewProps> = ({ resource, isLoading }) => {
  return (
    <Card className="p-6">
      <LoadingWrapper isLoading={isLoading || !resource}>
        {resource && <InterceptorOverviewContent resource={resource} />}
      </LoadingWrapper>
    </Card>
  );
};

const InterceptorOverviewContent: React.FC<{ resource: Interceptor | ClusterInterceptor }> = ({ resource }) => {
  const spec = resource.spec;
  const labels = Object.entries(resource.metadata.labels ?? {});

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h3 className="text-foreground mb-2 text-lg font-semibold">Metadata</h3>
        <dl className="grid grid-cols-4 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Created</dt>
            <dd>{formatTimestamp(resource.metadata.creationTimestamp)}</dd>
          </div>
          <div className="col-span-3">
            <dt className="text-muted-foreground">Labels</dt>
            <dd className="flex flex-wrap gap-1">
              {labels.length === 0 ? (
                <span className="text-muted-foreground">No labels</span>
              ) : (
                labels.map(([k, v]) => (
                  <Badge key={k} variant="secondary">
                    {k}:{v}
                  </Badge>
                ))
              )}
            </dd>
          </div>
        </dl>
      </section>

      <section>
        <h3 className="text-foreground mb-3 text-lg font-semibold">Client config</h3>
        {spec?.clientConfig?.url && (
          <div className="text-sm">
            URL: <code className="font-mono text-xs">{spec.clientConfig.url}</code>
          </div>
        )}
        {spec?.clientConfig?.service && (
          <dl className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Service</dt>
              <dd>{spec.clientConfig.service.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Namespace</dt>
              <dd>{spec.clientConfig.service.namespace}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Port</dt>
              <dd>{spec.clientConfig.service.port ?? "—"}</dd>
            </div>
          </dl>
        )}
        {!spec?.clientConfig?.url && !spec?.clientConfig?.service && (
          <p className="text-muted-foreground text-sm">No client config defined.</p>
        )}
        {spec?.description && <p className="text-muted-foreground mt-3 text-sm">{spec.description}</p>}
      </section>
    </div>
  );
};
