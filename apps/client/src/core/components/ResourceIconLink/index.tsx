import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import React from "react";
import { ResourceIconLinkProps } from "./types";
import { SquareArrowOutUpRight } from "lucide-react";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/core/components/ui/button";
import { cn } from "@/core/utils/classname";
import { sanitizeSvgBase64 } from "@/core/utils/sanitizeSvg";

const stopPropagation = (e: React.SyntheticEvent) => e.stopPropagation();

type ButtonSize = VariantProps<typeof buttonVariants>["size"];

const iconSizeByBtnSize = (btnSize: ButtonSize) => {
  switch (btnSize) {
    case "sm":
      return 16;
    case "default":
    case "lg":
      return 20;
    case "icon":
      return 16;
  }
};

const textDisplaySizeClasses = (btnSize: ButtonSize) => {
  switch (btnSize) {
    case "xs":
      return "px-2 py-0.5 text-[11px] gap-1 rounded-md";
    case "sm":
      return "px-2.5 py-1 text-xs gap-1.5 rounded-lg";
    case "lg":
      return "px-4 py-2 text-sm gap-2 rounded-lg";
    default:
      return "px-3 py-1.5 text-xs gap-1.5 rounded-lg";
  }
};

const renderIcon = (icon: React.ReactElement | string | undefined) => {
  if (!icon) return null;

  if (typeof icon === "string") {
    const sanitized = sanitizeSvgBase64(icon);
    return <img src={`data:image/svg+xml;base64,${sanitized}`} className="h-4 w-4" alt="" />;
  }

  return icon;
};

const DisabledResourceIconLink = ({ tooltip, icon, display, name, size }: ResourceIconLinkProps) => {
  return display === "text" ? (
    <Tooltip title={<div>{tooltip}</div>}>
      <span
        className={cn(
          "inline-flex cursor-not-allowed items-center border border-slate-200 text-slate-400 opacity-50",
          textDisplaySizeClasses(size)
        )}
      >
        {name} <SquareArrowOutUpRight size={11} />
      </span>
    </Tooltip>
  ) : (
    <Tooltip title={<div>{tooltip}</div>}>
      <div>
        <Button variant="ghost" size="icon" disabled className="!p-0 text-xs opacity-50">
          {renderIcon(icon)}
        </Button>
      </div>
    </Tooltip>
  );
};

const EnabledResourceIconLink = ({ tooltip, icon, href, display, name, size }: ResourceIconLinkProps) => {
  const iconSize = iconSizeByBtnSize(size);

  return display === "text" ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "text-primary border-primary bg-primary/5 hover:bg-primary/10 hover:border-primary/70 hover:text-primary/70 flex items-center border transition-colors",
        textDisplaySizeClasses(size)
      )}
    >
      {name} <SquareArrowOutUpRight size={11} />
    </a>
  ) : (
    <Tooltip
      title={
        <div className="flex items-center gap-1">
          <div>{tooltip}</div>
          <span> </span>
          <div>
            <SquareArrowOutUpRight className="text-muted-foreground/70" size={iconSize} />
          </div>
        </div>
      }
    >
      <span>
        <Button variant="ghost" size="icon" asChild className="!p-0">
          <a href={href} target="_blank" rel="noopener noreferrer">
            {renderIcon(icon)}
          </a>
        </Button>
      </span>
    </Tooltip>
  );
};

export const ResourceIconLink = ({
  disabled = false,
  tooltip,
  icon,
  href,
  name,
  size,
  display = "icon",
}: ResourceIconLinkProps) => {
  return (
    <div onClick={stopPropagation} onFocus={stopPropagation}>
      {disabled ? (
        <DisabledResourceIconLink tooltip={tooltip} icon={icon} display={display} name={name} size={size} />
      ) : (
        <EnabledResourceIconLink tooltip={tooltip} icon={icon} href={href} display={display} name={name} size={size} />
      )}
    </div>
  );
};
