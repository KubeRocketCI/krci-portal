import { Box, Breadcrumbs, Grid, Typography, useTheme } from "@mui/material";
import React from "react";
import { PageWrapperProps } from "./types";
import { Link } from "@tanstack/react-router";
import { Button } from "../ui/button";

export const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  breadcrumbs,
  headerSlot,
  breadcrumbsExtraContent,
}) => {
  const theme = useTheme();
  const hasBreadcrumbs = !!breadcrumbs && !!breadcrumbs.length;

  return (
    <Box
      sx={{
        pb: theme.typography.pxToRem(120),
        px: theme.typography.pxToRem(16),
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {hasBreadcrumbs ? (
        <Grid container spacing={1} alignItems={"center"} justifyContent={"space-between"}>
          <Grid item>
            <Grid container spacing={2} alignItems={"center"}>
              <Grid item>
                <Breadcrumbs>
                  {breadcrumbs?.map(({ label, route }) => {
                    const key = `breadcrumb-${label}`;

                    return route ? (
                      <Button variant="link" asChild key={key} className="p-0">
                        <Link to={route.to} params={route.params}>
                          {label}
                        </Link>
                      </Button>
                    ) : (
                      <Typography
                        key={key}
                        color="textPrimary"
                        sx={{
                          marginBottom: theme.typography.pxToRem(1),
                          fontSize: theme.typography.pxToRem(14),
                        }}
                      >
                        {label}
                      </Typography>
                    );
                  })}
                </Breadcrumbs>
              </Grid>
              <Grid item>{breadcrumbsExtraContent}</Grid>
            </Grid>
          </Grid>
          <Grid item>{headerSlot}</Grid>
        </Grid>
      ) : null}
      {children}
    </Box>
  );
};
