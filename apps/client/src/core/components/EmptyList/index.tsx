import React from "react";
import { EmptyListProps } from "./types";
import { Search, TriangleAlert } from "lucide-react";
import { Link as RouterLink } from "@tanstack/react-router";
import { Button } from "@/core/components/ui/button";

const renderIcon = (icon: React.ReactNode, isSearch: boolean, iconSize: number) => {
  if (icon) {
    return icon;
  }

  if (isSearch) {
    return (
      <Search width={iconSize} height={iconSize} color="#A2A7B7" />
    );
  }

  return (
    <TriangleAlert
      width={iconSize}
      height={iconSize}
      color="#A2A7B7"
    />
  );
};

export const EmptyList = ({
  customText,
  missingItemName,
  linkText = "Click here to add a new one",
  beforeLinkText,
  description,
  handleClick,
  route,
  isSearch = false,
  icon,
  iconSize = 96,
}: EmptyListProps) => {

  const renderActionLink = () => {
    if (!linkText) return null;

    if (route) {
      return (
        <RouterLink to={route.to} params={route.params}>
          <span className="text-sm">{linkText}</span>
        </RouterLink>
      );
    }

    if (handleClick) {
      return (
        <Button variant="link" onClick={handleClick} className="text-sm p-0 h-auto">
          <span className="text-sm">{linkText}</span>
        </Button>
      );
    }

    return null;
  };

  return (
    <div className="flex w-full justify-center">
      <div className="border-border flex w-full flex-col items-center justify-center rounded border border-dashed p-3">
        <div className="mb-4">{renderIcon(icon, isSearch, iconSize)}</div>
        <div className="mb-1 flex flex-col items-center gap-2">
          <p className="text-xl font-medium">{customText ? customText : `There are no ${missingItemName} here.`}</p>
          <div className="flex flex-row items-center gap-2">
            {!!beforeLinkText && <span className="text-muted-foreground text-sm">{beforeLinkText}</span>}
            {renderActionLink()}
          </div>
        </div>
        {!!description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>
    </div>
  );
};
