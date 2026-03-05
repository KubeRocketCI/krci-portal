import React from "react";
import { ResourceIconLink } from "../ResourceIconLink";
import { QuickLinkProps } from "./types";

export const QuickLink = ({
  name,
  href,
  tooltip = `Open in ${name}`,
  icon,
  setupAction,
  display = "icon",
  size = "sm",
  variant = "outline",
}: QuickLinkProps) => {
  const disabledTooltip = React.useMemo(() => {
    if (!setupAction) {
      return `Link to ${name} is not available.`;
    }

    return (
      <div className="flex flex-col gap-1">
        <div>Link to {name} is not available.</div>
        <div>
          Please, set up {name} {setupAction}
        </div>
      </div>
    );
  }, [name, setupAction]);

  return (
    <ResourceIconLink
      disabled={!href}
      icon={icon}
      tooltip={href ? tooltip : disabledTooltip}
      href={href}
      variant={variant}
      display={display}
      size={size}
      name={name}
    />
  );
};
