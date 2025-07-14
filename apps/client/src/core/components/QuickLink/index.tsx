import React from "react";
import { useDialogOpener } from "../../providers/Dialog/hooks";
import { ResourceIconLink } from "../ResourceIconLink";
import { QuickLinkExternalLinkProps } from "./types";
import { Button, Grid } from "@mui/material";
import { Link } from "@tanstack/react-router";
import { systemQuickLink } from "@my-project/shared";
import { ManageQuickLinkDialog } from "@/modules/platform/configuration/dialogs/ManageQuickLink";

export const QuickLink = ({
  name,
  Icon,
  iconBase64,
  externalLink,
  enabledText = `Open in ${name?.label}`,
  configurationRoute,
  quickLink,
  isTextButton = false,
  size = "small",
  variant = "outlined",
}: QuickLinkExternalLinkProps) => {
  const openManageQuickLinkDialog = useDialogOpener(ManageQuickLinkDialog);

  const renderDisabledTooltip = React.useCallback(() => {
    return (
      <>
        <Grid container spacing={1}>
          <Grid item>Link to {name?.label} is not available.</Grid>
          {!!configurationRoute && (
            <Grid item>
              Please, set up {name?.label}{" "}
              <Link to={configurationRoute?.to} params={configurationRoute?.params}>
                here
              </Link>
            </Grid>
          )}
          {!!quickLink && (
            <Grid item>
              Please, set up {name?.label}{" "}
              <Button
                variant="text"
                onClick={() =>
                  openManageQuickLinkDialog({
                    quickLink,
                    isSystem: Object.hasOwn(systemQuickLink, quickLink?.metadata.name),
                  })
                }
              >
                here
              </Button>
            </Grid>
          )}
        </Grid>
      </>
    );
  }, [configurationRoute, name?.label, quickLink, openManageQuickLinkDialog]);

  return externalLink ? (
    <ResourceIconLink
      Icon={Icon}
      iconBase64={iconBase64}
      tooltipTitle={enabledText}
      link={externalLink}
      variant={variant}
      isTextButton={isTextButton}
      size={size}
      name={name?.label}
    />
  ) : (
    <ResourceIconLink
      disabled
      Icon={Icon}
      iconBase64={iconBase64}
      tooltipTitle={renderDisabledTooltip()}
      name={name?.label}
      variant={variant}
      isTextButton={isTextButton}
      size={size}
    />
  );
};
