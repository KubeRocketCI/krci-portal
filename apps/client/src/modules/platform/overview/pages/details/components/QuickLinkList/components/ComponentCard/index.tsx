import { Button } from "@/core/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger } from "@/core/components/ui/dropdown-menu";
import React from "react";
import { ComponentCardProps } from "./types";
import { QuickLinkActionsMenu } from "@/modules/platform/configuration/modules/quicklinks/components/QuickLinkActionsMenu";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { EllipsisVertical, ExternalLink } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { sanitizeSvgBase64 } from "@/core/utils/sanitizeSvg";

export const ComponentCard = ({ component }: ComponentCardProps) => {
  const {
    spec: { url, icon },
    metadata: { name },
  } = component;

  // Validate and sanitize URL to only allow http/https protocols
  const _url = React.useMemo(() => {
    try {
      const testUrl = !/^https?:\/\//i.test(url) ? `https://${url}` : url;
      const parsed = new URL(testUrl);
      // Only allow http and https protocols
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        console.warn(`Invalid URL protocol: ${parsed.protocol}. Only http/https are allowed.`);
        return null;
      }
      return testUrl;
    } catch (error) {
      console.warn(`Invalid URL: ${url}`, error);
      return null;
    }
  }, [url]);

  const sanitizedIcon = sanitizeSvgBase64(icon);
  const [open, setOpen] = React.useState(false);

  const linkContent = (
    <>
      <span className="block size-8 shrink-0">
        <img src={`data:image/svg+xml;base64,${sanitizedIcon}`} alt="" className="size-full" />
      </span>
      <div className="min-w-0 flex-1">
        <TextWithTooltip text={name} className="text-foreground text-sm" />
      </div>
      <ExternalLink className="text-muted-foreground/40 group-hover:text-muted-foreground size-3.5 shrink-0 transition-colors" />
    </>
  );

  return (
    <div className="bg-card group flex items-center justify-between rounded-lg border p-3 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm dark:hover:border-slate-600">
      {_url ? (
        <Link to={_url} target="_blank" rel="noopener" className="flex min-w-0 flex-1 items-center gap-2.5">
          {linkContent}
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-2.5 opacity-50" title="Invalid URL">
          {linkContent}
        </div>
      )}
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="ml-1 size-7 shrink-0" aria-label="Options">
            <EllipsisVertical size={16} className="text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <QuickLinkActionsMenu data={{ quickLink: component }} variant="menu" />
      </DropdownMenu>
    </div>
  );
};
