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
    <div className="flex gap-2 items-center flex-row" style={{ maxWidth: '520px' }}>
      <TriangleAlert size={32} color={STATUS_COLOR.UNKNOWN} style={{ flexShrink: 0 }} />
      {typeof text === "string" ? (
        <p className="text-base text-muted-foreground">
          {text}
        </p>
      ) : (
        text
      )}
    </div>
  ) : (
    <>{children}</>
  );
};
