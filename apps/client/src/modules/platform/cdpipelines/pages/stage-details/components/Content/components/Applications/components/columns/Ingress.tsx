import { SquareArrowOutUpRight } from "lucide-react";
import { Badge } from "@/core/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu";
import { Application } from "@my-project/shared";

export const IngressColumn = ({ application }: { application: Application }) => {
  const externalURLs = application?.status?.summary?.externalURLs || [];

  if (externalURLs.length === 0) {
    return (
      <Badge variant="outline" className="bg-muted text-muted-foreground py-1 text-xs [&>svg]:size-4">
        <SquareArrowOutUpRight className="mr-1" />0 Ingresses
      </Badge>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Badge
          variant="outline"
          className="bg-muted text-muted-foreground hover:bg-accent hover:border-primary/50 cursor-pointer py-1 text-xs [&>svg]:size-4"
        >
          <SquareArrowOutUpRight className="mr-1" />
          {externalURLs.length} {externalURLs.length === 1 ? "Ingress" : "Ingresses"}
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-80 w-80 overflow-y-auto">
        <div className="border-border text-muted-foreground border-b px-2 py-1.5 text-xs font-medium">
          Ingresses ({externalURLs.length})
        </div>
        {externalURLs.map((url: string) => (
          <DropdownMenuItem key={url} className="text-xs" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <SquareArrowOutUpRight className="text-muted-foreground mr-2" />
              <span className="truncate">{url}</span>
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
