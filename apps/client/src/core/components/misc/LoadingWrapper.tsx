import { ReactNode } from "react";
import { LoadingProgressBar } from "../ui/LoadingProgressBar";
import { LoadingSpinner } from "../ui/LoadingSpinner";

const renderLoadingComponent = (variant: "spinner" | "progress", iconProps?: { size?: number }) => {
  switch (variant) {
    case "spinner":
      return <LoadingSpinner size={iconProps?.size} />;
    case "progress":
      return <LoadingProgressBar />;
    default:
      return null;
  }
};

export function LoadingWrapper({
  isLoading,
  children,
  variant = "spinner",
  iconProps,
}: {
  isLoading: boolean;
  children: ReactNode;
  variant?: "spinner" | "progress";
  iconProps?: {
    size?: number;
  };
}) {
  return isLoading ? renderLoadingComponent(variant, iconProps) : children;
}
