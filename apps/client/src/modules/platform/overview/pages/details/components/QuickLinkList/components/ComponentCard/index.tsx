import { Button } from "@/core/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger } from "@/core/components/ui/dropdown-menu";
import React from "react";
import { ComponentCardProps } from "./types";
import { QuickLinkActionsMenu } from "@/modules/platform/configuration/modules/quicklinks/components/QuickLinkActionsMenu";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { EllipsisVertical } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { sanitizeSvgBase64 } from "@/core/utils/sanitizeSvg";

export const ComponentCard = ({ component }: ComponentCardProps) => {
  const {
    spec: { url, icon },
    metadata: { name },
  } = component;

  const _url = !/^https?:\/\//i.test(url) ? `https://${url}` : url;
  const sanitizedIcon = sanitizeSvgBase64(icon);
  const [open, setOpen] = React.useState(false);

  return (
    <div className="bg-card relative h-16 rounded border p-4 shadow-xs">
      <div className="flex flex-row items-center justify-between gap-4">
        <Button variant="link" asChild>
          <Link to={_url} target="_blank" rel="noopener" className="min-w-0">
            <div className="flex flex-row items-center gap-4">
              <span className="block h-8 w-8 shrink-0">
                <img src={`data:image/svg+xml;base64,${sanitizedIcon}`} alt="" className="h-full w-full" />
              </span>
              <div className="min-w-0">
                <TextWithTooltip text={name} />
              </div>
            </div>
          </Link>
        </Button>
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={"Options"}>
              <EllipsisVertical size={20} className="text-secondary-dark" />
            </Button>
          </DropdownMenuTrigger>
          <QuickLinkActionsMenu
            data={{
              quickLink: component,
            }}
            variant="menu"
          />
        </DropdownMenu>
      </div>
    </div>
  );
};
