import * as React from "react";
import { Info } from "lucide-react";
import { Card } from "@/core/components/ui/card";

export interface RemoteClusterNoticeProps {
  /** Override the heading. Defaults to the monitoring wording. */
  title?: string;
  /** Override the body copy. Defaults to the monitoring wording. */
  description?: string;
}

const DEFAULT_DESCRIPTION =
  "We're working on making this work for remote clusters. For now, deployment metrics are available only for stages running in the local cluster.";

export const RemoteClusterNotice: React.FC<RemoteClusterNoticeProps> = ({
  title = "Coming soon for remote clusters",
  description = DEFAULT_DESCRIPTION,
}) => (
  <Card className="p-6">
    <div className="flex items-start gap-3">
      <Info className="text-primary mt-1 size-5 shrink-0" />
      <div>
        <h4 className="text-foreground text-base font-semibold">{title}</h4>
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      </div>
    </div>
  </Card>
);
