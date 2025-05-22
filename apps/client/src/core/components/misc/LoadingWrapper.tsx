import { ReactNode } from "react";
import { LoadingProgressBar } from "../ui/LoadingProgressBar";
import { LoadingSpinner } from "../ui/LoadingSpinner";

const renderLoadingComponent = (variant: "spinner" | "progress") => {
  switch (variant) {
    case "spinner":
      return <LoadingSpinner />;
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
}: {
  isLoading: boolean;
  children: ReactNode;
  variant?: "spinner" | "progress";
}) {
  return isLoading ? renderLoadingComponent(variant) : children;
}
