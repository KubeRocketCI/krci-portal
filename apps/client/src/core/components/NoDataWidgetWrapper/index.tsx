import { STATUS_COLOR } from "@/k8s/constants/colors";
import { Stack, Typography } from "@mui/material";
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
    <Stack spacing={1} alignItems="center" direction="row" maxWidth={(t) => t.typography.pxToRem(520)}>
      <TriangleAlert size={32} color={STATUS_COLOR.UNKNOWN} style={{ flexShrink: 0 }} />
      {typeof text === "string" ? (
        <Typography variant={"body1"} color="secondary.dark">
          {text}
        </Typography>
      ) : (
        text
      )}
    </Stack>
  ) : (
    <>{children}</>
  );
};
