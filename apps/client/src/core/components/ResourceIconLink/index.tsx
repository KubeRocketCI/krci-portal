import { Button } from "@/core/components/ui/button";
import { Tooltip } from "@/core/components/ui/tooltip";
import React from "react";
import { ResourceIconLinkProps } from "./types";
import { SquareArrowOutUpRight } from "lucide-react";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/core/components/ui/button";

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

const DisabledResourceIconLink = ({
  tooltipTitle,
  Icon,
  iconBase64,
  withoutDisabledStyle,
  variant,
  isTextButton,
  name,
  size,
}: ResourceIconLinkProps) => {
  const iconSize = iconSizeByBtnSize(size);

  return isTextButton ? (
    <Button variant={variant} disabled className={!withoutDisabledStyle ? "opacity-50" : ""} size={size}>
      {name}
      <SquareArrowOutUpRight className="text-muted-foreground" size={iconSize} />
    </Button>
  ) : (
    <Tooltip title={<div>{tooltipTitle}</div>}>
      <div>
        <Button variant="ghost" size="icon" disabled className={!withoutDisabledStyle ? "opacity-50" : ""}>
          {iconBase64 ? (
            <img src={`data:image/svg+xml;base64,${iconBase64}`} className="h-4 w-4" alt="" />
          ) : Icon ? (
            Icon
          ) : null}
        </Button>
      </div>
    </Tooltip>
  );
};

const EnabledResourceIconLink = ({
  tooltipTitle,
  Icon,
  iconBase64,
  link,
  variant,
  isTextButton,
  name,
  size,
}: ResourceIconLinkProps) => {
  const iconSize = iconSizeByBtnSize(size);

  return isTextButton ? (
    <Button
      variant={variant}
      asChild
      size={size}
      className="text-secondary-dark border-secondary-dark hover:bg-secondary-dark/10"
    >
      <a href={link} target="_blank" rel="noopener noreferrer">
        {name}
        <SquareArrowOutUpRight size={iconSize} />
      </a>
    </Button>
  ) : (
    <Tooltip
      title={
        <div className="flex items-center gap-1">
          <div>{tooltipTitle}</div>
          <span> </span>
          <div>
            <SquareArrowOutUpRight size={iconSize} />
          </div>
        </div>
      }
    >
      <span>
        <Button variant="ghost" size="icon" asChild>
          <a href={link} target="_blank" rel="noopener noreferrer">
            {iconBase64 ? (
              <img src={`data:image/svg+xml;base64,${iconBase64}`} className="h-4 w-4" alt="" />
            ) : Icon ? (
              Icon
            ) : null}
          </a>
        </Button>
      </span>
    </Tooltip>
  );
};

export const ResourceIconLink = ({
  disabled = false,
  tooltipTitle,
  Icon,
  iconBase64,
  link,
  withoutDisabledStyle,
  variant,
  name,
  size,
  isTextButton,
}: ResourceIconLinkProps) => {
  return (
    <div onClick={stopPropagation} onFocus={stopPropagation}>
      {disabled ? (
        <DisabledResourceIconLink
          tooltipTitle={tooltipTitle}
          Icon={Icon}
          iconBase64={iconBase64}
          withoutDisabledStyle={withoutDisabledStyle}
          variant={variant}
          isTextButton={isTextButton}
          name={name}
          size={size}
        />
      ) : (
        <EnabledResourceIconLink
          tooltipTitle={tooltipTitle}
          Icon={Icon}
          iconBase64={iconBase64}
          link={link}
          variant={variant}
          isTextButton={isTextButton}
          name={name}
          size={size}
        />
      )}
    </div>
  );
};
