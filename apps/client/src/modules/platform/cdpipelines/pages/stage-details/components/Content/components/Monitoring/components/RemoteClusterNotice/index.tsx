import * as React from "react";
import { Info } from "lucide-react";
import { Card } from "@/core/components/ui/card";

export const RemoteClusterNotice: React.FC = () => (
  <Card className="p-6">
    <div className="flex items-start gap-3">
      <Info className="text-primary mt-1 size-5 shrink-0" />
      <div>
        <h4 className="text-foreground text-base font-semibold">Coming soon for remote clusters</h4>
        <p className="text-muted-foreground mt-1 text-sm">
          We&apos;re working on making this work for remote clusters. For now, deployment metrics are available only for
          stages running in the local cluster.
        </p>
      </div>
    </div>
  </Card>
);
