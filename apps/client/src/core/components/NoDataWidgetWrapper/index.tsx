import { STATUS_COLOR } from "@/k8s/constants/colors";
import { TriangleAlert } from "lucide-react";
import React from "react";

interface NoDataWidgetWrapperProps {
  hasData: boolean;
  isLoading: boolean;
  text?: string | React.ReactElement;
  children?: React.ReactNode;
}

export const NoDataWidgetWrapper: React.FC<NoDataWidgetWrapperProps> = ({
  hasData,
  isLoading,
  text = "No data available.",
  children,
}) => {
  return !isLoading && !hasData ? (
    <div className="flex flex-row items-center gap-2" style={{ maxWidth: "520px" }}>
      <TriangleAlert size={32} color={STATUS_COLOR.UNKNOWN} style={{ flexShrink: 0 }} />
      {typeof text === "string" ? <p className="text-muted-foreground text-base">{text}</p> : text}
    </div>
  ) : (
    <>{children}</>
  );
};
