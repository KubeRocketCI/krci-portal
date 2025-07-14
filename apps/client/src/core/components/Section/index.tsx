import { Box, Stack, Tooltip, Typography, useTheme } from "@mui/material";
import React from "react";
import { SectionProps } from "./types";
import { CopyButton } from "../CopyButton";
import { Info } from "lucide-react";

export const Section: React.FC<SectionProps> = ({ title, titleTooltip, enableCopyTitle, description, children }) => {
  const theme = useTheme();
  return (
    <Stack spacing={4} flexGrow={1}>
      <Stack spacing={1}>
        {title && (
          <Stack direction="row" spacing={0} alignItems={"center"}>
            {typeof title === "string" ? (
              <Typography color="primary.dark" fontSize={theme.typography.pxToRem(32)}>
                {title}
              </Typography>
            ) : (
              title
            )}
            {titleTooltip && (
              <Tooltip title={titleTooltip}>
                <Info size={15} />
              </Tooltip>
            )}
            {enableCopyTitle && typeof title === "string" && <CopyButton text={title} />}
          </Stack>
        )}
        {description && <Typography variant={"body1"}>{description}</Typography>}
      </Stack>

      <Box
        sx={{
          mt: theme.typography.pxToRem(16),
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </Box>
    </Stack>
  );
};
