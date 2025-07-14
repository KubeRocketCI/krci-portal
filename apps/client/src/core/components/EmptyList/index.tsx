import { Box, Link, Stack, Typography, useTheme } from "@mui/material";
import React from "react";
import { EmptyListProps } from "./types";
import { Search, TriangleAlert } from "lucide-react";
import { DefaultTheme } from "@mui/styles/defaultTheme";
import { Link as RouterLink } from "@tanstack/react-router";

const renderIcon = (icon: React.ReactNode, isSearch: boolean, iconSize: number, theme: DefaultTheme) => {
  if (icon) {
    return icon;
  }

  if (isSearch) {
    return (
      <Search width={theme.typography.pxToRem(iconSize)} height={theme.typography.pxToRem(iconSize)} color="#A2A7B7" />
    );
  }

  return (
    <TriangleAlert
      width={theme.typography.pxToRem(iconSize)}
      height={theme.typography.pxToRem(iconSize)}
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
  const theme = useTheme();

  const renderActionLink = () => {
    if (!linkText) return null;

    if (route) {
      return (
        <RouterLink to={route.to} params={route.params}>
          <Typography component="span" variant={"body2"}>
            {linkText}
          </Typography>
        </RouterLink>
      );
    }

    if (handleClick) {
      return (
        <Link onClick={handleClick} component={"button"} lineHeight={1}>
          <Typography component="span" variant={"body2"}>
            {linkText}
          </Typography>
        </Link>
      );
    }

    return null;
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <Box
        display={"flex"}
        flexDirection={"column"}
        alignItems={"center"}
        justifyContent="center"
        sx={{
          padding: theme.typography.pxToRem(10),
          width: "100%",
          border: `1px dashed ${theme.palette.divider}`,
          borderRadius: theme.typography.pxToRem(4),
        }}
      >
        <Box sx={{ mb: theme.typography.pxToRem(16) }}>{renderIcon(icon, isSearch, iconSize, theme)}</Box>
        <Stack spacing={1} alignItems="center" style={{ marginBottom: theme.typography.pxToRem(5) }}>
          <Typography fontSize={theme.typography.pxToRem(20)} fontWeight={500}>
            {customText ? customText : `There are no ${missingItemName} here.`}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            {!!beforeLinkText && (
              <Typography variant={"body2"} component="span" color={"textSecondary"}>
                {beforeLinkText}
              </Typography>
            )}
            {renderActionLink()}
          </Stack>
        </Stack>
        {!!description && (
          <Typography variant={"body2"} color={"textSecondary"}>
            {description}
          </Typography>
        )}
      </Box>
    </Box>
  );
};
