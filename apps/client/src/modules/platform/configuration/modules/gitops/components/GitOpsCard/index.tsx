import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import { Codebase, codebaseStatus } from "@my-project/shared";
import { FolderGit2, GitBranch, MoreVertical, Server } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger } from "@/core/components/ui/dropdown-menu";
import { StatusIcon } from "@/core/components/StatusIcon";
import { getCodebaseStatusIcon } from "@/k8s/api/groups/KRCI/Codebase/utils";
import { IntegrationCard } from "../../../../components/IntegrationCard";
import { GitOpsActionsMenu } from "../GitOpsActionsMenu";

interface GitOpsCardProps {
  codebase: Codebase;
  onEdit: () => void;
}

function getStatusBadge(status: string | undefined) {
  if (!status) {
    return (
      <Badge variant="outline" className="border-slate-300 bg-slate-100 text-slate-700">
        Unknown
      </Badge>
    );
  }
  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    [codebaseStatus.created]: { bg: "bg-green-100", text: "text-green-700", border: "border-green-300" },
    [codebaseStatus.initialized]: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
    [codebaseStatus.failed]: { bg: "bg-red-100", text: "text-red-700", border: "border-red-300" },
    [codebaseStatus.in_progress]: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300" },
  };
  const colors = statusColors[status] || { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300" };
  return (
    <Badge variant="outline" className={`${colors.bg} ${colors.text} ${colors.border}`}>
      {status}
    </Badge>
  );
}

export function GitOpsCard({ codebase, onEdit }: GitOpsCardProps) {
  const status = codebase.status?.status;
  const gitWebUrl = codebase.status?.gitWebUrl;
  const gitServer = codebase.spec.gitServer;
  const gitUrlPath = codebase.spec.gitUrlPath;
  const defaultBranch = codebase.spec.defaultBranch || "main";
  const ownerReference = codebase?.metadata?.ownerReferences?.[0]?.kind;
  const codebaseStatusIcon = getCodebaseStatusIcon(codebase);

  return (
    <IntegrationCard>
      <IntegrationCard.Header
        icon={
          <StatusIcon
            Icon={codebaseStatusIcon.component}
            color={codebaseStatusIcon.color}
            isSpinning={codebaseStatusIcon.isSpinning}
            Title={
              <>
                <p className="text-sm font-semibold">{`Status: ${status || "Unknown"}`}</p>
                {status === codebaseStatus.failed && (
                  <p className="mt-3 text-sm font-medium">{codebase?.status?.detailedMessage}</p>
                )}
              </>
            }
          />
        }
        title={codebase.metadata.name}
        badge={getStatusBadge(status)}
        subtitle="GitOps Repository"
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Actions
                <MoreVertical className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <GitOpsActionsMenu codebase={codebase} ownerReference={ownerReference} onEdit={onEdit} />
          </DropdownMenu>
        }
      />
      <div className="divide-y divide-slate-100">
        {gitWebUrl && (
          <IntegrationCard.LinkRow
            label="Source Code"
            href={gitWebUrl}
            copyValue={gitWebUrl}
            icon={<FolderGit2 className="h-4 w-4 text-blue-600" />}
          />
        )}
        {gitServer && (
          <IntegrationCard.TextRow
            label="Git Server"
            value={gitServer}
            icon={<Server className="h-4 w-4 text-purple-600" />}
            iconBoxClassName="bg-purple-50"
          />
        )}
        {gitUrlPath && (
          <IntegrationCard.TextRow
            label="Repository Path"
            value={gitUrlPath}
            icon={<FolderGit2 className="h-4 w-4 text-green-600" />}
            iconBoxClassName="bg-green-50"
          />
        )}
        <IntegrationCard.TextRow
          label="Default Branch"
          value={defaultBranch}
          icon={<GitBranch className="h-4 w-4 text-orange-600" />}
          iconBoxClassName="bg-orange-50"
        />
      </div>
    </IntegrationCard>
  );
}
