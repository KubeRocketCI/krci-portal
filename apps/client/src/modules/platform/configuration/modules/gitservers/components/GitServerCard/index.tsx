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
        <Badge variant="outline" className="border-slate-300 bg-slate-100 text-slate-700">
          <HelpCircle className="mr-1 h-3 w-3" />
          Unknown
        </Badge>
      );
    }
    if (connected) {
      return (
        <Badge variant="outline" className="border-green-300 bg-green-100 text-green-700">
          <CheckCircle className="mr-1 h-3 w-3" />
          Connected
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-red-300 bg-red-100 text-red-700">
        <XCircle className="mr-1 h-3 w-3" />
        Disconnected
      </Badge>
    );
  };

  const getProviderBadge = () => {
    const providerConfig = {
      github: { label: "GitHub", icon: Github, color: "bg-gray-100 text-gray-700 border-gray-300" },
      gitlab: { label: "GitLab", icon: GitBranch, color: "bg-orange-100 text-orange-700 border-orange-300" },
      gerrit: { label: "Gerrit", icon: GitBranch, color: "bg-blue-100 text-blue-700 border-blue-300" },
      gitea: { label: "Gitea", icon: GitBranch, color: "bg-green-100 text-green-700 border-green-300" },
    };

    const config = providerConfig[gitProvider as keyof typeof providerConfig] || providerConfig.github;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className="flex h-full flex-col border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="border-b border-slate-200 p-4">
        <div className="mb-2 flex items-start justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
              <GitBranch className="h-5 w-5 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-sm font-medium text-slate-900" title={gitServerName}>
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
              <div className="mb-1 text-xs text-slate-500">Git Host</div>
              <div className="truncate font-mono text-sm text-slate-900" title={gitHost}>
                {gitHost}
              </div>
            </div>
            <CopyIconButton value={gitHost} className="ml-2 flex-shrink-0" />
          </div>
        )}

        {error && (
          <div className="mt-3 rounded border border-red-200 bg-red-50 p-2">
            <div className="line-clamp-2 text-xs text-red-700" title={error}>
              {error}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
