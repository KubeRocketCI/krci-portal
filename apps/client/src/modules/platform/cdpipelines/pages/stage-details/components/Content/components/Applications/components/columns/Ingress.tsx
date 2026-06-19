import { AlertTriangle, SquareArrowOutUpRight } from "lucide-react";
import { Badge } from "@/core/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu";
import { Application } from "@my-project/shared";

export type ExposureURL = {
  url: string;
  kind: "Ingress" | "HTTPRoute";
  healthy: boolean;
  reason?: string;
};

type MergedURL = ExposureURL;

export const IngressColumn = ({ application, extraURLs }: { application: Application; extraURLs?: ExposureURL[] }) => {
  const argoURLs: MergedURL[] = (application?.status?.summary?.externalURLs || []).map((url: string) => ({
    url,
    kind: "Ingress",
    healthy: true,
  }));

  const allURLs: MergedURL[] = [...argoURLs, ...(extraURLs ?? [])];

  if (allURLs.length === 0) {
    return (
      <Badge variant="outline" className="bg-muted text-muted-foreground py-1 text-xs [&>svg]:size-4">
        <SquareArrowOutUpRight className="text-muted-foreground/70 mr-1" />—
      </Badge>
    );
  }

  const unhealthyCount = allURLs.filter((u) => !u.healthy).length;
  const urlLabel = allURLs.length === 1 ? "1 URL" : `${allURLs.length} URLs`;

  const ingressURLs = allURLs.filter((u) => u.kind === "Ingress");
  const httpRouteURLs = allURLs.filter((u) => u.kind === "HTTPRoute");
  const hasBothSources = ingressURLs.length > 0 && httpRouteURLs.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Badge
          variant="outline"
          className="bg-muted text-muted-foreground hover:bg-accent hover:border-primary/50 cursor-pointer py-1 text-xs [&>svg]:size-4"
        >
          <SquareArrowOutUpRight className="text-muted-foreground/70 mr-1" />
          {urlLabel}
          {unhealthyCount > 0 && (
            <span className="ml-1.5 flex items-center gap-0.5 text-amber-600">
              <AlertTriangle className="size-3" />
              {unhealthyCount}
            </span>
          )}
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-80 w-80 overflow-y-auto">
        <div className="border-border text-muted-foreground flex items-center justify-between border-b px-2 py-1.5 text-xs font-medium">
          <span>URLs ({allURLs.length})</span>
          {unhealthyCount > 0 && (
            <span className="flex items-center gap-0.5 text-amber-600">
              <AlertTriangle className="size-3" />
              {unhealthyCount}
            </span>
          )}
        </div>

        {hasBothSources ? (
          <>
            <div className="text-muted-foreground/70 px-2 py-1 text-xs font-semibold tracking-wide uppercase">
              Ingress
            </div>
            {ingressURLs.map((entry) => (
              <URLEntry key={entry.url} entry={entry} />
            ))}
            <div className="text-muted-foreground/70 border-border border-t px-2 py-1 text-xs font-semibold tracking-wide uppercase">
              HTTPRoute
            </div>
            {httpRouteURLs.map((entry) => (
              <URLEntry key={entry.url} entry={entry} />
            ))}
          </>
        ) : (
          allURLs.map((entry) => <URLEntry key={entry.url} entry={entry} />)
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const URLEntry = ({ entry }: { entry: MergedURL }) => {
  if (!entry.healthy) {
    return (
      <div className="px-2 py-1.5">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
          <span className="text-muted-foreground truncate text-xs">{entry.url}</span>
        </div>
        {entry.reason && <p className="text-muted-foreground/70 ml-5 text-xs">{entry.reason}</p>}
      </div>
    );
  }

  return (
    <DropdownMenuItem className="text-xs" asChild>
      <a href={entry.url} target="_blank" rel="noopener noreferrer">
        <SquareArrowOutUpRight className="text-muted-foreground/70 mr-2 size-3.5" />
        <span className="truncate">{entry.url}</span>
      </a>
    </DropdownMenuItem>
  );
};
