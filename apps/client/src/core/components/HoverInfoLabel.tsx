import { TooltipContent, TooltipRoot, TooltipTrigger } from "@/core/components/ui/tooltip";

interface HoverInfoLabelProps {
  label: string;
  tooltip?: string;
}

export function HoverInfoLabel({ label, tooltip }: HoverInfoLabelProps) {
  if (!tooltip) {
    return <span className="text-muted-foreground text-xs tracking-wider uppercase">{label}</span>;
  }
  return (
    <TooltipRoot>
      <TooltipTrigger asChild>
        <span className="text-muted-foreground border-b border-dotted text-xs tracking-wider uppercase">{label}</span>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </TooltipRoot>
  );
}
