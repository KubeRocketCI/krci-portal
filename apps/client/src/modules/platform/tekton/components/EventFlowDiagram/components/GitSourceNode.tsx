import { Handle, Position } from "@xyflow/react";
import { Github, Gitlab, GitBranch, Globe } from "lucide-react";
import { GitServer } from "@my-project/shared";
import { cn } from "@/core/utils/classname";
import { NODE_KIND_TAILWIND, NODE_KIND } from "../constants";

const providerIcon = (provider: string | undefined) => {
  switch (provider) {
    case "github":
      return Github;
    case "gitlab":
      return Gitlab;
    case "gerrit":
    case "bitbucket":
      return GitBranch;
    default:
      return Globe;
  }
};

export const GitSourceNode = ({ data }: { data: { gitServer: GitServer | null } }) => {
  const Icon = providerIcon(data.gitServer?.spec?.gitProvider);
  return (
    <div
      className={cn("border-border rounded-lg border p-3 text-sm shadow-sm", NODE_KIND_TAILWIND[NODE_KIND.GIT_SOURCE])}
    >
      <Handle type="source" position={Position.Right} />
      <div className="flex items-center gap-2 font-medium">
        <Icon size={16} />
        <span>{data.gitServer?.metadata?.name ?? "Webhook source"}</span>
      </div>
      {data.gitServer?.spec?.gitHost && (
        <div className="text-muted-foreground mt-1 font-mono text-xs">{data.gitServer.spec.gitHost}</div>
      )}
    </div>
  );
};
