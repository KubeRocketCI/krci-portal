import { Card } from "@/core/components/ui/card";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import { GitServer } from "@my-project/shared";
import { CheckCircle, XCircle, HelpCircle, MoreVertical, Github, GitBranch } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger } from "@/core/components/ui/dropdown-menu";
import { CopyIconButton } from "../../../../components/CopyIconButton";
import { GitServerActionsMenu } from "../GitServerActionsMenu";

interface GitServerCardProps {
  gitServer: GitServer;
  onEdit: () => void;
}

export function GitServerCard({ gitServer, onEdit }: GitServerCardProps) {
  const connected = gitServer?.status?.connected;
  const error = gitServer?.status?.error;
  const gitServerName = gitServer.metadata.name;
  const gitHost = gitServer.spec?.gitHost;
  const gitProvider = gitServer.spec?.gitProvider || "github";
  const ownerReference = gitServer?.metadata?.ownerReferences?.[0]?.kind;

  const getStatusBadge = () => {
    if (connected === undefined) {
      return (
        <Badge variant="neutral">
          <HelpCircle />
          Unknown
        </Badge>
      );
    }
    if (connected) {
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

  const getProviderBadge = () => {
    const providerConfig = {
      github: { label: "GitHub", icon: Github, variant: "neutral" as const },
      gitlab: { label: "GitLab", icon: GitBranch, variant: "warning" as const },
      gerrit: { label: "Gerrit", icon: GitBranch, variant: "info" as const },
      gitea: { label: "Gitea", icon: GitBranch, variant: "success" as const },
    };

    const config = providerConfig[gitProvider as keyof typeof providerConfig] ?? providerConfig.github;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon />
        {config.label}
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
              <GitBranch className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-foreground truncate text-sm font-medium" title={gitServerName}>
                {gitServerName}
              </h4>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="ml-2 h-8 w-8 flex-shrink-0 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <GitServerActionsMenu gitServer={gitServer} ownerReference={ownerReference} onEdit={onEdit} />
          </DropdownMenu>
        </div>
        <div className="flex flex-wrap gap-2">
          {getProviderBadge()}
          {getStatusBadge()}
        </div>
      </div>

      {/* Body - Essential Info */}
      <div className="flex-1 p-4">
        {gitHost && (
          <div className="mb-2 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="text-muted-foreground mb-1 text-xs">Git Host</div>
              <div className="text-foreground truncate font-mono text-sm" title={gitHost}>
                {gitHost}
              </div>
            </div>
            <CopyIconButton value={gitHost} className="ml-2 flex-shrink-0" />
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
