import React from "react";
import { Button } from "@/core/components/ui/button";
import { TooltipRoot, TooltipTrigger, TooltipContent } from "@/core/components/ui/tooltip";
import { Check, Copy, ExternalLink } from "lucide-react";

interface CopyToClipboardButtonProps {
  getValue: () => string;
}

export const CopyToClipboardButton = ({ getValue }: CopyToClipboardButtonProps) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    const value = getValue();
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silently fail
    }
  };

  return (
    <TooltipRoot>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="dark"
          size="icon"
          onClick={handleCopy}
          className="rounded-tl-none rounded-bl-none px-3"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{copied ? "Copied!" : "Copy to clipboard"}</TooltipContent>
    </TooltipRoot>
  );
};

interface OpenExternalLinkButtonProps {
  getUrl: () => string;
}

export const OpenExternalLinkButton = ({ getUrl }: OpenExternalLinkButtonProps) => {
  const handleOpen = () => {
    const url = getUrl();
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <TooltipRoot>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="dark"
          size="icon"
          onClick={handleOpen}
          className="rounded-tl-none rounded-bl-none px-3"
        >
          <ExternalLink size={16} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Open in new tab</TooltipContent>
    </TooltipRoot>
  );
};
