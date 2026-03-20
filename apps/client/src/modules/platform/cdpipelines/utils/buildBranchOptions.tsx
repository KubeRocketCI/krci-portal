import { Badge } from "@/core/components/ui/badge";
import { GitBranch } from "lucide-react";
import type { SelectOption } from "@/core/components/form";
import type { CodebaseBranchLike } from "@my-project/shared";
import { cn } from "@/core/utils/classname";

/**
 * Builds branch select options for application branch pickers.
 *
 * @param compact - Use smaller icon and text sizing (for card-style UIs).
 */
export function buildBranchOptions<T extends CodebaseBranchLike>(
  branches: readonly T[],
  defaultBranch: string | undefined,
  compact = false
): SelectOption[] {
  return branches.map((el) => ({
    value: el.metadata.name,
    keywords: [el.spec.branchName, el.metadata.name],
    label: (
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <GitBranch className={cn("text-muted-foreground shrink-0", compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
        <span className={cn("truncate", compact && "text-xs")}>{el.spec.branchName}</span>
        {el.spec.branchName === defaultBranch && (
          <Badge variant="outline" className={cn("shrink-0 text-xs", !compact && "ml-1")}>
            default
          </Badge>
        )}
      </div>
    ),
  }));
}
