import { Card } from "@/core/components/ui/card";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import { Tooltip } from "@/core/components/ui/tooltip";
import type { Secret } from "@my-project/shared";
import {
  SECRET_ANNOTATION_CLUSTER_CONNECTED,
  SECRET_ANNOTATION_CLUSTER_ERROR,
  SECRET_LABEL_CLUSTER_TYPE,
  clusterType,
  parseConfigJson,
  safeDecode,
} from "@my-project/shared";
import { CheckCircle, XCircle, HelpCircle, MoreVertical, ShieldAlert, Key, Boxes } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger } from "@/core/components/ui/dropdown-menu";
import { CopyIconButton } from "../../../../components/CopyIconButton";
import { ClusterActionsMenu } from "../ClusterActionsMenu";

interface ClusterCardProps {
  clusterSecret: Secret;
  onEdit: () => void;
}

export function ClusterCard({ clusterSecret, onEdit }: ClusterCardProps) {
  const connected = clusterSecret?.metadata?.annotations?.[SECRET_ANNOTATION_CLUSTER_CONNECTED];
  const error = clusterSecret?.metadata?.annotations?.[SECRET_ANNOTATION_CLUSTER_ERROR];
  const clusterName = clusterSecret.metadata.name;
  const ownerReference = clusterSecret?.metadata?.ownerReferences?.[0]?.kind;

  // Get cluster type
  const clusterTypeValue = clusterSecret.metadata?.labels?.[SECRET_LABEL_CLUSTER_TYPE];
  const clusterTypeLabel = clusterTypeValue === clusterType.irsa ? "IRSA" : "Bearer";
  const ClusterTypeIcon = clusterTypeValue === clusterType.irsa ? Key : Boxes;

  // Get cluster host based on type
  let clusterHost: string | undefined;
  if (clusterTypeValue === clusterType.irsa) {
    clusterHost = safeDecode(clusterSecret.data?.server || "");
  } else {
    try {
      const config = parseConfigJson(clusterSecret.data?.config || "");
      clusterHost = config?.clusters?.[0]?.cluster?.server;
    } catch {
      clusterHost = undefined;
    }
  }

  const getStatusBadge = () => {
    if (connected === undefined) {
      return (
        <Badge variant="neutral">
          <HelpCircle />
          Unknown
        </Badge>
      );
    }
    if (connected === "true") {
      return (
        <Badge variant="success">
          <CheckCircle />
          Connected
        </Badge>
      );
    }
    return (
      <Badge variant="error">
        <XCircle />
        Disconnected
      </Badge>
    );
  };

  return (
    <Card className="border-border flex h-full flex-col border shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="border-border border-b p-4">
        <div className="mb-2 flex items-start justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="bg-primary/10 text-primary flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
              <Boxes className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-foreground truncate text-sm font-medium" title={clusterName}>
                {clusterName}
              </h4>
            </div>
            {ownerReference && (
              <Tooltip title={`Managed by ${ownerReference}`}>
                <ShieldAlert size={16} className="text-status-missing flex-shrink-0" />
              </Tooltip>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="ml-2 h-8 w-8 flex-shrink-0 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <ClusterActionsMenu clusterSecret={clusterSecret} ownerReference={ownerReference} onEdit={onEdit} />
          </DropdownMenu>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="inline-flex items-center gap-1 text-xs">
            <ClusterTypeIcon size={12} />
            {clusterTypeLabel}
          </Badge>
          {getStatusBadge()}
        </div>
      </div>

      {/* Body - Essential Info */}
      <div className="flex-1 p-4">
        {clusterHost && (
          <div className="mb-2 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="text-muted-foreground mb-1 text-xs">Cluster Host</div>
              <div className="text-foreground truncate font-mono text-sm" title={clusterHost}>
                {clusterHost}
              </div>
            </div>
            <CopyIconButton value={clusterHost} className="ml-2 flex-shrink-0" />
          </div>
        )}

        {error && (
          <div className="border-destructive/30 bg-destructive/10 mt-3 rounded-md border p-2">
            <div className="text-destructive line-clamp-2 text-xs" title={error}>
              {error}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
